<?php

namespace Tests\Feature;

use App\Enums\CourseLevel;
use App\Models\GymCourse;
use App\Models\GymPhoto;
use App\Models\GymProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** "Foto" of a course: several, the first one on the cards. */
class GymCoursePhotoTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake(GymPhoto::DISK);
    }

    private function image(string $name = 'foto.jpg'): UploadedFile
    {
        return UploadedFile::fake()->image($name, 1200, 800);
    }

    private function course(?GymProfile $gym = null): GymCourse
    {
        $gym ??= GymProfile::factory()->approved()->create();
        $course = $gym->courses()->create(['name' => 'Pilates', 'level' => CourseLevel::All, 'is_active' => true]);
        $course->lessons()->create(['weekday' => 1, 'starts_at' => '18:30:00', 'ends_at' => '19:30:00', 'capacity' => 14]);

        return $course;
    }

    public function test_the_gym_adds_several_photos_shown_on_its_page_and_on_the_card()
    {
        $course = $this->course();
        $gym = $course->gymProfile;

        $this->actingAs($gym->user)
            ->post(route('gym.courses.photos.store', $course), ['photos' => [$this->image('a.jpg'), $this->image('b.jpg')]])
            ->assertSessionHasNoErrors();

        $photos = $course->photos()->get();
        $this->assertCount(2, $photos);
        $photos->each(fn ($photo) => Storage::disk(GymPhoto::DISK)->assertExists($photo->path));

        $this->get(route('gyms.show', $gym->slug))
            ->assertInertia(fn (Assert $page) => $page
                ->has('gym.courses.0.photos', 2)
                ->where('gym.courses.0.photos.0', $photos[0]->url())
                ->where('gym.courses.0.maxPlaces', 14));

        $this->get(route('courses.search'))
            ->assertInertia(fn (Assert $page) => $page->where('courses.0.photoUrl', $photos[0]->url()));
    }

    public function test_a_photo_goes_first()
    {
        $course = $this->course();
        $this->actingAs($course->gymProfile->user)
            ->post(route('gym.courses.photos.store', $course), ['photos' => [$this->image('a.jpg'), $this->image('b.jpg')]]);
        [, $second] = $course->photos()->get()->all();

        $this->actingAs($course->gymProfile->user)
            ->post(route('gym.courses.photos.first', [$course, $second]))
            ->assertSessionHasNoErrors();

        $this->assertSame($second->id, $course->photos()->first()?->id);
    }

    public function test_no_more_than_the_maximum()
    {
        $course = $this->course();
        $files = array_map(fn (int $i) => $this->image("{$i}.jpg"), range(1, GymCourse::MAX_PHOTOS + 1));

        $this->actingAs($course->gymProfile->user)
            ->post(route('gym.courses.photos.store', $course), ['photos' => $files])
            ->assertSessionHasErrors('photos');

        $this->assertSame(0, $course->photos()->count());
    }

    public function test_the_photo_is_checked()
    {
        $course = $this->course();

        $this->actingAs($course->gymProfile->user)
            ->post(route('gym.courses.photos.store', $course), ['photos' => [UploadedFile::fake()->image('small.jpg', 300, 200)]])
            ->assertSessionHasErrors('photos.0');
    }

    public function test_another_gym_cannot_touch_the_photos()
    {
        $course = $this->course();
        $this->actingAs($course->gymProfile->user)
            ->post(route('gym.courses.photos.store', $course), ['photos' => [$this->image()]]);
        $photo = $course->photos()->sole();
        $other = GymProfile::factory()->approved()->create();
        $otherCourse = $this->course($other);

        $this->actingAs($other->user)->post(route('gym.courses.photos.store', $course), ['photos' => [$this->image()]])->assertNotFound();
        $this->actingAs($other->user)->delete(route('gym.courses.photos.destroy', [$course, $photo]))->assertNotFound();
        // Its own course, with a photo of another course.
        $this->actingAs($other->user)->delete(route('gym.courses.photos.destroy', [$otherCourse, $photo]))->assertNotFound();

        $this->assertSame(1, $course->photos()->count());
    }

    public function test_deleting_a_photo_or_the_course_deletes_the_files()
    {
        $course = $this->course();
        $user = $course->gymProfile->user;
        $this->actingAs($user)->post(route('gym.courses.photos.store', $course), ['photos' => [$this->image('a.jpg'), $this->image('b.jpg')]]);
        [$first, $second] = $course->photos()->get()->all();

        $this->actingAs($user)->delete(route('gym.courses.photos.destroy', [$course, $first]))->assertSessionHasNoErrors();
        Storage::disk(GymPhoto::DISK)->assertMissing($first->path);
        $this->assertSame(1, $course->photos()->count());

        $this->actingAs($user)->delete(route('gym.courses.destroy', $course))->assertRedirect(route('gym.courses'));
        Storage::disk(GymPhoto::DISK)->assertMissing($second->path);
        $this->assertSame(0, GymCourse::count());
    }
}
