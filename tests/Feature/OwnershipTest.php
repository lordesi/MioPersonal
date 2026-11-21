<?php

namespace Tests\Feature;

use App\Enums\CourseLevel;
use App\Enums\GymLinkSide;
use App\Enums\GymLinkStatus;
use App\Models\Booking;
use App\Models\GymProfile;
use App\Models\GymTrainerLink;
use App\Models\TrainerProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

/**
 * The ID of someone else's record in a private address answers 404, as if it
 * didn't exist, and changes nothing (app/Policies). One record per area, every
 * action that receives it.
 */
class OwnershipTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Notification::fake();
    }

    public function test_a_client_cannot_touch_someone_elses_booking()
    {
        $booking = Booking::factory()->confirmed()->create();
        $before = $booking->fresh()?->getAttributes();

        $this->assertEveryActionIsNotFound(User::factory()->create(), [
            ['get', 'client.bookings.sent'],
            ['patch', 'client.bookings.cancel'],
            ['patch', 'client.bookings.people'],
            ['post', 'client.bookings.invite.regenerate'],
            ['post', 'client.bookings.reschedule.accept'],
            ['delete', 'client.bookings.reschedule.decline'],
            ['post', 'client.bookings.proposal.accept'],
            ['delete', 'client.bookings.proposal.decline'],
            ['post', 'client.bookings.review'],
        ], $booking);

        $this->assertSame($before, $booking->fresh()?->getAttributes());
    }

    public function test_a_trainer_cannot_touch_another_trainers_booking()
    {
        $booking = Booking::factory()->confirmed()->create();
        $before = $booking->fresh()?->getAttributes();

        $this->assertEveryActionIsNotFound(TrainerProfile::factory()->approved()->create()->user, [
            ['post', 'trainer.requests.accept'],
            ['post', 'trainer.requests.decline'],
            ['patch', 'trainer.sessions.cancel'],
            ['patch', 'trainer.sessions.note'],
            ['post', 'trainer.sessions.no-show'],
            ['delete', 'trainer.sessions.no-show.destroy'],
            ['post', 'trainer.sessions.reschedule'],
            ['delete', 'trainer.sessions.reschedule.withdraw'],
            ['delete', 'trainer.calendar.sessions.destroy'],
        ], $booking);

        $this->assertSame($before, $booking->fresh()?->getAttributes());
    }

    public function test_only_the_two_sides_answer_a_gym_link()
    {
        $link = new GymTrainerLink;
        $link->gym_profile_id = GymProfile::factory()->approved()->create()->id;
        $link->trainer_profile_id = TrainerProfile::factory()->approved()->create()->id;
        $link->forceFill(['status' => GymLinkStatus::Pending, 'initiated_by' => GymLinkSide::Gym])->save();

        $this->assertEveryActionIsNotFound(TrainerProfile::factory()->approved()->create()->user, [
            ['post', 'trainer.gyms.accept'],
            ['post', 'trainer.gyms.decline'],
            ['delete', 'trainer.gyms.destroy'],
        ], $link);

        $this->assertEveryActionIsNotFound(GymProfile::factory()->approved()->create()->user, [
            ['post', 'gym.trainers.accept'],
            ['post', 'gym.trainers.decline'],
            ['delete', 'gym.trainers.destroy'],
        ], $link);

        $this->assertSame(GymLinkStatus::Pending, $link->fresh()?->status);
    }

    public function test_a_gym_cannot_touch_another_gyms_courses_photos_and_promotions()
    {
        $owner = GymProfile::factory()->approved()->create();
        $course = $owner->courses()->create(['name' => 'Pilates', 'level' => CourseLevel::All, 'is_active' => true]);
        $coursePhoto = $course->photos()->create(['path' => 'gym-courses/one.jpg', 'sort' => 0]);
        $photo = $owner->photos()->create(['path' => 'gyms/one.jpg', 'is_cover' => false]);
        $promotion = $owner->promotions()->create(['title' => 'Primo mese a metà prezzo', 'discount_percent' => 50]);
        $intruder = GymProfile::factory()->approved()->create()->user;

        $this->assertEveryActionIsNotFound($intruder, [
            ['post', 'gym.courses.update'],
            ['delete', 'gym.courses.destroy'],
            ['post', 'gym.courses.photos.store'],
        ], $course);
        $this->assertEveryActionIsNotFound($intruder, [
            ['post', 'gym.courses.photos.first'],
            ['delete', 'gym.courses.photos.destroy'],
        ], $course, $coursePhoto);
        $this->assertEveryActionIsNotFound($intruder, [
            ['post', 'gym.photos.cover'],
            ['delete', 'gym.photos.destroy'],
        ], $photo);
        $this->assertEveryActionIsNotFound($intruder, [
            ['patch', 'gym.promotions.update'],
            ['delete', 'gym.promotions.destroy'],
        ], $promotion);

        $this->assertModelExists($course);
        $this->assertModelExists($coursePhoto);
        $this->assertFalse($photo->fresh()?->is_cover);
        $this->assertSame('Primo mese a metà prezzo', $promotion->fresh()?->title);
    }

    /**
     * @param  list<array{string, string}>  $actions  [HTTP method, route name]
     */
    private function assertEveryActionIsNotFound(User $intruder, array $actions, mixed ...$parameters): void
    {
        foreach ($actions as [$method, $name]) {
            $this->actingAs($intruder)
                ->{$method}(route($name, $parameters))
                ->assertNotFound();
        }
    }
}
