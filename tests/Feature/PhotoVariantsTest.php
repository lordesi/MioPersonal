<?php

namespace Tests\Feature;

use App\Models\TrainerPhoto;
use App\Models\TrainerProfile;
use App\Support\SafeImage;
use Database\Seeders\CatalogSeeder;
use Database\Seeders\DemoTrainerSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** The lighter WebP copies of the public photos (SafeImage::VARIANTS). */
class PhotoVariantsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');
        Storage::fake('local');
    }

    public function test_an_uploaded_photo_gets_its_light_copies()
    {
        $path = SafeImage::store(UploadedFile::fake()->image('ritratto.jpg', 3000, 2000), 'trainers/1', 'public');

        foreach (SafeImage::VARIANTS as $size => $side) {
            $copy = Storage::disk('public')->get(SafeImage::variantPath($path, $size));
            [$width, $height, $type] = getimagesizefromstring((string) $copy);

            $this->assertSame(IMAGETYPE_WEBP, $type);
            $this->assertSame($side, max($width, $height));
            $this->assertSame(round(3000 / 2000, 2), round($width / $height, 2));
        }
    }

    public function test_a_small_photo_is_never_made_bigger()
    {
        $path = SafeImage::store(UploadedFile::fake()->image('piccola.png', 400, 300), 'gyms/1', 'public');

        [$width] = getimagesizefromstring((string) Storage::disk('public')->get(SafeImage::variantPath($path, 'lg')));
        $this->assertSame(400, $width);
    }

    public function test_private_photos_get_no_copies()
    {
        $path = SafeImage::store(UploadedFile::fake()->image('chat.jpg', 1200, 900), 'conversations/1', 'local');

        $this->assertSame([$path], Storage::disk('local')->allFiles('conversations/1'));
    }

    public function test_the_page_shows_the_copy_or_the_original_while_it_is_missing()
    {
        Storage::disk('public')->put('trainers/1/vecchia.jpg', 'x');

        $this->assertStringEndsWith('trainers/1/vecchia.jpg', SafeImage::url('public', 'trainers/1/vecchia.jpg', 'md'));

        Storage::disk('public')->put('trainers/1/vecchia.jpg.md.webp', 'x');

        $this->assertStringEndsWith('trainers/1/vecchia.jpg.md.webp', SafeImage::url('public', 'trainers/1/vecchia.jpg', 'md'));
        $this->assertStringEndsWith('trainers/1/vecchia.jpg', SafeImage::url('public', 'trainers/1/vecchia.jpg'));
    }

    public function test_the_command_makes_the_missing_copies_and_deletes_the_orphan_ones()
    {
        $disk = Storage::disk('public');
        $disk->put('trainers/1/prima.jpg', UploadedFile::fake()->image('prima.jpg', 1000, 800)->getContent());
        $disk->put('trainers/1/cancellata.jpg.md.webp', 'x');

        $this->artisan('photos:variants')->assertSuccessful();

        foreach (array_keys(SafeImage::VARIANTS) as $size) {
            $this->assertTrue($disk->exists("trainers/1/prima.jpg.{$size}.webp"));
        }
        $this->assertFalse($disk->exists('trainers/1/cancellata.jpg.md.webp'));

        // Nothing more to do the next time.
        $this->artisan('photos:variants')->expectsOutputToContain('0 copies made, 0 copies')->assertSuccessful();
    }

    public function test_the_search_cards_use_the_medium_copy()
    {
        $this->seed([CatalogSeeder::class, DemoTrainerSeeder::class]);
        $profile = TrainerProfile::query()->published()->firstOrFail();
        $profile->photos()->delete();
        /** @var TrainerPhoto $portrait */
        $portrait = $profile->photos()->create(['path' => "trainers/{$profile->id}/ritratto.jpg", 'is_portrait' => true, 'sort' => 0]);
        Storage::disk('public')->put($portrait->path, 'x');
        Storage::disk('public')->put(SafeImage::variantPath($portrait->path, 'md'), 'x');

        $this->get(route('trainers.search'))->assertInertia(fn (Assert $page) => $page
            ->where('trainers', fn ($trainers) => collect($trainers)->contains(
                fn ($card) => str_ends_with((string) ($card['photoUrl'] ?? ''), $portrait->path.'.md.webp'),
            )));
    }
}
