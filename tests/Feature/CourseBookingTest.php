<?php

namespace Tests\Feature;

use App\Enums\GroupSessionStatus;
use App\Enums\RegistrationStatus;
use App\Models\GroupSession;
use App\Models\GymCourse;
use App\Models\GymCourseLesson;
use App\Models\GymProfile;
use App\Models\User;
use App\Notifications\GroupSessionChanged;
use Carbon\CarbonImmutable;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Testing\TestResponse;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * "Prenotazione posto" of a gym's course: clients take a place in a lesson
 * of this week or the next one, up to the lesson's places.
 */
class CourseBookingTest extends TestCase
{
    use RefreshDatabase;

    /** Thursday 22 October 2026, the lesson's day. */
    private const THURSDAY = '2026-10-22';

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(CatalogSeeder::class);
        Notification::fake();
        // Wednesday 21 October 2026, morning in Rome.
        $this->travelTo(CarbonImmutable::parse('2026-10-21 09:00', 'Europe/Rome'));
    }

    /** Pilates on Thursday 18:30–19:30, 2 places, bookable. */
    private function lesson(bool $bookable = true): GymCourseLesson
    {
        $gym = GymProfile::factory()->approved()->create();
        $course = new GymCourse(['name' => 'Pilates', 'level' => 'all', 'is_active' => true, 'bookable' => $bookable]);
        $course->gymProfile()->associate($gym)->save();

        return $course->lessons()->create(['weekday' => 4, 'starts_at' => '18:30', 'ends_at' => '19:30', 'capacity' => 2]);
    }

    private function book(GymCourseLesson $lesson, User $client, string $date = self::THURSDAY): TestResponse
    {
        return $this->actingAs($client)->post(
            route('gyms.lessons.register', ['slug' => $lesson->course->gymProfile->slug, 'lesson' => $lesson->id]),
            ['date' => $date],
        );
    }

    public function test_clients_take_the_places_of_a_lesson_made_once()
    {
        $lesson = $this->lesson();
        $first = User::factory()->create();

        $this->book($lesson, $first)->assertSessionHasNoErrors();
        $this->book($lesson, User::factory()->create())->assertSessionHasNoErrors();
        $this->book($lesson, User::factory()->create())->assertSessionHasErrors('place');

        $session = GroupSession::sole();
        $this->assertSame($lesson->id, $session->gym_course_lesson_id);
        $this->assertSame('2026-10-22 16:30', $session->starts_at->utc()->format('Y-m-d H:i'));
        $this->assertSame(2, $session->activeRegistrations()->count());

        // The plan shows the places and the client's own.
        $this->actingAs($first)->get(route('gyms.show', $lesson->course->gymProfile->slug))
            ->assertInertia(fn (Assert $page) => $page
                ->where('gym.courseWeeks.0.3.lessons.0.bookable', true)
                ->where('gym.courseWeeks.0.3.lessons.0.remaining', 0)
                ->where('gym.courseWeeks.0.3.lessons.0.booked', true));

        // Not a lesson people find in "Eventi".
        $this->get(route('events.search'))->assertInertia(fn (Assert $page) => $page->has('events', 0));
    }

    public function test_only_bookable_courses_on_their_days_in_the_next_two_weeks()
    {
        $client = User::factory()->create();

        $this->book($this->lesson(bookable: false), $client)->assertSessionHasErrors('place');

        $lesson = $this->lesson();
        $this->book($lesson, $client, '2026-10-21')->assertSessionHasErrors('date');
        $this->book($lesson, $client, '2026-11-26')->assertSessionHasErrors('place');
        $this->assertSame(0, GroupSession::count());
    }

    public function test_a_lesson_called_off_tells_the_clients_and_comes_back()
    {
        $lesson = $this->lesson();
        $client = User::factory()->create();
        $this->book($lesson, $client);
        $gym = $lesson->course->gymProfile;

        $this->actingAs($gym->user)
            ->post(route('gym.courses.lessons.cancel', $lesson), ['date' => self::THURSDAY, 'note' => 'Istruttrice malata'])
            ->assertSessionHasNoErrors();

        $session = GroupSession::sole();
        $this->assertSame(GroupSessionStatus::Cancelled, $session->status);
        Notification::assertSentTo($client, GroupSessionChanged::class, fn (GroupSessionChanged $notification) => $notification->kind === GroupSessionChanged::CANCELLED);

        $this->actingAs($gym->user)
            ->delete(route('gym.courses.lessons.restore', $lesson), ['date' => self::THURSDAY])
            ->assertSessionHasNoErrors();

        $this->assertSame(GroupSessionStatus::Published, $session->fresh()?->status);
        $this->assertSame(RegistrationStatus::Registered, $session->registrations()->sole()->status);
        Notification::assertSentTo($client, GroupSessionChanged::class, fn (GroupSessionChanged $notification) => $notification->kind === GroupSessionChanged::RESTORED);
    }

    public function test_the_gym_opens_the_clients_of_a_lesson_and_sets_the_places_left()
    {
        $lesson = $this->lesson();
        $this->book($lesson, User::factory()->create());
        $gym = $lesson->course->gymProfile;

        $this->actingAs($gym->user)
            ->get(route('gym.courses.lessons.clients', ['lesson' => $lesson, 'date' => self::THURSDAY]))
            ->assertRedirect(route('gym.events.show', GroupSession::sole()));

        $session = GroupSession::sole();
        $this->actingAs($gym->user)->get(route('gym.events.show', $session))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('gym/event')->where('event.lesson', true)->has('registrations', 1));

        $this->actingAs($gym->user)->put(route('gym.events.seats', $session), ['remaining' => 0])->assertSessionHasNoErrors();
        $this->assertSame(0, $session->fresh()?->remainingSeats());

        // A lesson is changed from "Corsi", not from "Eventi".
        $this->actingAs($gym->user)->get(route('gym.events.edit', $session))->assertForbidden();
    }

    public function test_a_lesson_deleted_cancels_its_next_places()
    {
        $lesson = $this->lesson();
        $client = User::factory()->create();
        $this->book($lesson, $client);
        $gym = $lesson->course->gymProfile;

        $this->actingAs($gym->user)->delete(route('gym.courses.destroy', $lesson->course))->assertRedirect();

        $this->assertSame(GroupSessionStatus::Cancelled, GroupSession::sole()->status);
        Notification::assertSentTo($client, GroupSessionChanged::class);
    }

    public function test_bookable_lessons_need_their_places()
    {
        $gym = GymProfile::factory()->approved()->create();

        $this->actingAs($gym->user)
            ->post(route('gym.courses.store'), [
                'name' => 'Spinning',
                'level' => 'all',
                'is_active' => true,
                'bookable' => true,
                'lessons' => [['weekday' => 1, 'start' => '18:30', 'end' => '19:30', 'room' => '', 'capacity' => null]],
            ])
            ->assertSessionHasErrors('lessons.0.capacity');
    }
}
