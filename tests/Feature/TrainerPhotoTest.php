<?php

namespace Tests\Feature;

use App\Enums\TrainerProfileStatus;
use App\Models\TrainerPhoto;
use App\Models\TrainerProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** "Foto della galleria" in "Modifica profilo": the carousel after the profile photo. */
class TrainerPhotoTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake(TrainerPhoto::DISK);
    }

    private function image(string $name = 'foto.jpg'): UploadedFile
    {
        return UploadedFile::fake()->image($name, 1200, 800);
    }

    /** An approved trainer with the profile photo. */
    private function trainer(): TrainerProfile
    {
        $profile = TrainerProfile::factory()->approved()->create();
        $profile->photos()->create(['path' => "trainers/{$profile->id}/ritratto.jpg", 'is_portrait' => true]);

        return $profile;
    }

    /**
     * Gallery photos already saved, in this order.
     *
     * @return list<TrainerPhoto>
     */
    private function gallery(TrainerProfile $profile, int $count): array
    {
        $photos = [];

        foreach (range(1, $count) as $number) {
            $path = $this->image()->store("trainers/{$profile->id}/gallery", TrainerPhoto::DISK);
            $photos[] = $profile->photos()->create(['path' => $path, 'is_portrait' => false, 'sort' => $number * 10]);
        }

        return $photos;
    }

    public function test_the_trainer_adds_photos_at_the_end()
    {
        $profile = $this->trainer();
        [$first] = $this->gallery($profile, 1);

        $this->actingAs($profile->user)
            ->post(route('trainer.photos.store'), ['photos' => [$this->image('a.jpg'), $this->image('b.png')]])
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $photos = $profile->galleryPhotos()->get();
        $this->assertCount(3, $photos);
        $this->assertSame($first->id, $photos->first()?->id);

        foreach ($photos as $photo) {
            $this->assertFalse($photo->is_portrait);
            Storage::disk(TrainerPhoto::DISK)->assertExists($photo->path);
        }

        // The profile photo stays the only portrait.
        $this->assertSame(1, $profile->photos()->where('is_portrait', true)->count());
    }

    public function test_at_most_eight_gallery_photos()
    {
        $profile = $this->trainer();
        $this->gallery($profile, TrainerProfile::MAX_GALLERY_PHOTOS - 1);

        $this->actingAs($profile->user)
            ->post(route('trainer.photos.store'), ['photos' => [$this->image(), $this->image()]])
            ->assertSessionHasErrors(['photos' => 'Puoi aggiungere ancora 1 foto.']);

        $this->assertCount(TrainerProfile::MAX_GALLERY_PHOTOS - 1, $profile->galleryPhotos()->get());
    }

    public function test_only_real_photos_big_enough()
    {
        $profile = $this->trainer();

        $this->actingAs($profile->user)
            ->post(route('trainer.photos.store'), ['photos' => [
                UploadedFile::fake()->create('menu.pdf', 100, 'application/pdf'),
                UploadedFile::fake()->image('piccola.jpg', 400, 300),
            ]])
            ->assertSessionHasErrors(['photos.0', 'photos.1']);

        $this->assertSame(0, $profile->galleryPhotos()->count());
        $this->assertSame([], Storage::disk(TrainerPhoto::DISK)->allFiles("trainers/{$profile->id}/gallery"));
    }

    public function test_the_trainer_deletes_a_photo_and_its_file()
    {
        $profile = $this->trainer();
        [$photo] = $this->gallery($profile, 1);

        $this->actingAs($profile->user)
            ->delete(route('trainer.photos.destroy', $photo))
            ->assertRedirect();

        $this->assertModelMissing($photo);
        Storage::disk(TrainerPhoto::DISK)->assertMissing($photo->path);
    }

    public function test_other_trainers_photos_and_the_profile_photo_cannot_be_touched()
    {
        $profile = $this->trainer();
        [$photo] = $this->gallery($profile, 1);
        $other = $this->trainer();
        $portrait = $profile->portrait;
        $this->assertNotNull($portrait);

        $this->actingAs($other->user)
            ->delete(route('trainer.photos.destroy', $photo))
            ->assertNotFound();
        $this->actingAs($profile->user)
            ->delete(route('trainer.photos.destroy', $portrait))
            ->assertNotFound();

        $this->assertModelExists($photo);
        $this->assertModelExists($portrait);
    }

    public function test_a_profile_not_approved_yet_cannot_add_photos()
    {
        $profile = TrainerProfile::factory()->status(TrainerProfileStatus::Review)->create();

        $this->actingAs($profile->user)
            ->post(route('trainer.photos.store'), ['photos' => [$this->image()]])
            ->assertForbidden();

        $this->assertSame(0, $profile->photos()->count());
    }

    public function test_the_profile_photo_is_in_the_circle_not_in_the_carousel()
    {
        $profile = $this->trainer();
        [$a, $b] = $this->gallery($profile, 2);

        $this->get(route('trainers.show', $profile->slug))
            ->assertInertia(fn (Assert $page) => $page
                ->where('trainer.portraitUrl', $profile->portrait?->url())
                ->where('trainer.photos', [
                    ['caption' => '', 'url' => $a->url()],
                    ['caption' => '', 'url' => $b->url()],
                ])
            );
    }

    public function test_without_gallery_photos_the_carousel_is_empty()
    {
        $profile = $this->trainer();

        $this->get(route('trainers.show', $profile->slug))
            ->assertInertia(fn (Assert $page) => $page
                ->where('trainer.photos', [])
                ->whereNot('trainer.portraitUrl', null)
            );
    }

    public function test_the_account_menu_shows_the_trainer_profile_photo()
    {
        $profile = $this->trainer();

        $this->actingAs($profile->user)
            ->get(route('trainer.profile.edit'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('auth.user.avatar', $profile->portrait?->url())
            );
    }

    public function test_the_edit_page_lists_the_gallery()
    {
        $profile = $this->trainer();
        [$a, $b] = $this->gallery($profile, 2);

        $this->actingAs($profile->user)
            ->get(route('trainer.profile.edit'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('trainer/profile')
                ->where('gallery', [['id' => $a->id, 'url' => $a->url()], ['id' => $b->id, 'url' => $b->url()]])
                ->where('maxGalleryPhotos', TrainerProfile::MAX_GALLERY_PHOTOS)
            );
    }
}
