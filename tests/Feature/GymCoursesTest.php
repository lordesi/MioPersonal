<?php

namespace Tests\Feature;

use App\Enums\GymLinkStatus;
use App\Models\Discipline;
use App\Models\GroupSession;
use App\Models\GymCourse;
use App\Models\GymCourseCancellation;
use App\Models\GymProfile;
use App\Models\TrainerProfile;
use App\Models\User;
use Carbon\CarbonImmutable;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** "Corsi" of the gym area and the plan of the week on the public profile. */
class GymCoursesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(CatalogSeeder::class);
        Storage::fake('public');
        // Wednesday 21 October 2026, morning in Rome.
        $this->travelTo(CarbonImmutable::parse('2026-10-21 09:00', 'Europe/Rome'));
    }

    /**
     * What the dialog sends.
     *
     * @param  array<string, mixed>  $changes
     * @return array<string, mixed>
     */
    private function course(array $changes = []): array
    {
        return [
            'name' => 'Pilates',
            'description' => 'Matwork per tutti.',
            'discipline_id' => Discipline::where('is_active', true)->value('id'),
            'level' => 'beginner',
            'instructor_trainer_id' => null,
            'instructor_name' => 'Giulia',
            'is_active' => true,
            'lessons' => [
                ['weekday' => 1, 'start' => '18:30', 'end' => '19:30', 'room' => 'Sala 2', 'capacity' => 12],
                ['weekday' => 4, 'start' => '18:30', 'end' => '19:30', 'room' => '', 'capacity' => null],
            ],
            ...$changes,
        ];
    }

    private function gym(): GymProfile
    {
        return GymProfile::factory()->approved()->create();
    }

    public function test_the_gym_adds_a_course_shown_on_the_public_plan()
    {
        $gym = $this->gym();

        $this->actingAs($gym->user)
            ->post(route('gym.courses.store'), $this->course())
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('gym.courses'));

        $course = GymCourse::sole();
        $this->assertSame(2, $course->lessons()->count());

        $this->get(route('gyms.show', $gym->slug))
            ->assertInertia(fn (Assert $page) => $page
                ->where('gym.courses.0.name', 'Pilates')
                ->where('gym.courses.0.when', 'Lun, Gio 18:30')
                ->where('gym.courses.0.instructor', 'Giulia')
                ->where('gym.courses.0.maxPlaces', 12)
                ->where('gym.courses.0.photos', [])
                // This week: Monday 19 and Thursday 22.
                ->where('gym.courseWeeks.0.0.date', '2026-10-19')
                ->where('gym.courseWeeks.0.0.lessons.0.room', 'Sala 2')
                ->where('gym.courseWeeks.0.0.lessons.0.capacity', 12)
                ->has('gym.courseWeeks.0.3.lessons', 1)
                ->has('gym.courseWeeks.0.1.lessons', 0)
                ->where('gym.courseWeeks.1.0.date', '2026-10-26')
            );
    }

    public function test_a_hidden_course_is_not_public()
    {
        $gym = $this->gym();
        $this->actingAs($gym->user)->post(route('gym.courses.store'), $this->course(['is_active' => false]));

        $this->get(route('gyms.show', $gym->slug))
            ->assertInertia(fn (Assert $page) => $page->has('gym.courses', 0)->has('gym.courseWeeks.0.0.lessons', 0));
    }

    public function test_the_lessons_are_checked()
    {
        $gym = $this->gym();

        $this->actingAs($gym->user)
            ->post(route('gym.courses.store'), $this->course([
                'name' => '',
                'lessons' => [['weekday' => 8, 'start' => '19:00', 'end' => '18:00']],
            ]))
            ->assertSessionHasErrors(['name', 'lessons.0.weekday', 'lessons.0.end']);

        $this->actingAs($gym->user)
            ->post(route('gym.courses.store'), $this->course(['lessons' => []]))
            ->assertSessionHasErrors('lessons');

        $this->assertSame(0, GymCourse::count());
    }

    public function test_the_instructor_is_a_trainer_who_works_at_the_gym()
    {
        $gym = $this->gym();
        $stranger = TrainerProfile::factory()->approved()->create();

        $this->actingAs($gym->user)
            ->post(route('gym.courses.store'), $this->course(['instructor_trainer_id' => $stranger->id]))
            ->assertSessionHasErrors('instructor_trainer_id');

        $trainer = TrainerProfile::factory()->approved()->create();
        $gym->links()->forceCreate(['trainer_profile_id' => $trainer->id, 'status' => GymLinkStatus::Accepted, 'initiated_by' => 'gym']);

        $this->actingAs($gym->user)
            ->post(route('gym.courses.store'), $this->course(['instructor_trainer_id' => $trainer->id]))
            ->assertSessionHasNoErrors();

        $course = GymCourse::sole();
        // The trainer's own name, not the one written.
        $this->assertNull($course->instructor_name);

        $this->get(route('gyms.show', $gym->slug))
            ->assertInertia(fn (Assert $page) => $page
                ->where('gym.courseWeeks.0.0.lessons.0.instructor', $trainer->user->name)
                ->where('gym.courseWeeks.0.0.lessons.0.instructorHref', route('trainers.show', $trainer->slug, false))
            );
    }

    public function test_an_update_keeps_the_lessons_sent_with_their_id()
    {
        $gym = $this->gym();
        $this->actingAs($gym->user)->post(route('gym.courses.store'), $this->course());
        $course = GymCourse::sole();
        $monday = $course->lessons()->where('weekday', 1)->sole();
        $monday->cancellations()->create(['date' => '2026-10-26']);

        $this->actingAs($gym->user)
            ->post(route('gym.courses.update', $course), $this->course([
                'name' => 'Pilates base',
                'lessons' => [['id' => $monday->id, 'weekday' => 1, 'start' => '19:00', 'end' => '20:00']],
            ]))
            ->assertSessionHasNoErrors();

        $course->refresh();
        $this->assertSame('Pilates base', $course->name);
        $this->assertSame([$monday->id], $course->lessons()->pluck('id')->all());
        // The day called off stays.
        $this->assertSame(1, GymCourseCancellation::count());
    }

    public function test_a_lesson_is_called_off_on_one_day_and_restored()
    {
        $gym = $this->gym();
        $this->actingAs($gym->user)->post(route('gym.courses.store'), $this->course());
        $thursday = GymCourse::sole()->lessons()->where('weekday', 4)->sole();

        $this->actingAs($gym->user)
            ->post(route('gym.courses.lessons.cancel', $thursday), ['date' => '2026-10-22', 'note' => 'Istruttrice in ferie'])
            ->assertSessionHasNoErrors();

        $this->get(route('gyms.show', $gym->slug))
            ->assertInertia(fn (Assert $page) => $page
                ->where('gym.courseWeeks.0.3.lessons.0.cancelled', true)
                ->where('gym.courseWeeks.0.3.lessons.0.cancelNote', 'Istruttrice in ferie')
                // Only that day.
                ->where('gym.courseWeeks.1.3.lessons.0.cancelled', false)
            );

        // Not a day of that lesson, and not a past one.
        $this->actingAs($gym->user)->post(route('gym.courses.lessons.cancel', $thursday), ['date' => '2026-10-23'])->assertSessionHasErrors('date');
        $this->actingAs($gym->user)->post(route('gym.courses.lessons.cancel', $thursday), ['date' => '2026-10-15'])->assertSessionHasErrors('date');

        $this->actingAs($gym->user)->delete(route('gym.courses.lessons.restore', $thursday), ['date' => '2026-10-22'])->assertSessionHasNoErrors();
        $this->assertSame(0, GymCourseCancellation::count());
    }

    public function test_another_gym_cannot_touch_the_course()
    {
        $gym = $this->gym();
        $this->actingAs($gym->user)->post(route('gym.courses.store'), $this->course());
        $course = GymCourse::sole();
        $other = $this->gym();

        $this->actingAs($other->user)->post(route('gym.courses.update', $course), $this->course())->assertNotFound();
        $this->actingAs($other->user)->delete(route('gym.courses.destroy', $course))->assertNotFound();
        $this->actingAs($other->user)->post(route('gym.courses.lessons.cancel', $course->lessons->first()), ['date' => '2026-10-26'])->assertNotFound();
    }

    public function test_a_lesson_can_no_longer_be_booked_here()
    {
        $gym = $this->gym();
        $this->actingAs($gym->user)->post(route('gym.courses.store'), $this->course());
        $lesson = GymCourse::sole()->lessons()->first();
        $client = User::factory()->create();

        $this->actingAs($client)
            ->post("/palestra/{$gym->slug}/lezioni/{$lesson->id}/prenota", ['date' => '2026-10-26'])
            ->assertNotFound();
        $this->assertSame(0, GroupSession::count());
    }
}
