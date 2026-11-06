<?php

namespace Tests\Feature;

use App\Actions\Account\DeleteUser;
use App\Enums\GymLinkSide;
use App\Enums\GymLinkStatus;
use App\Enums\PlaceType;
use App\Enums\TrainerProfileStatus;
use App\Models\Booking;
use App\Models\City;
use App\Models\GymProfile;
use App\Models\GymTrainerLink;
use App\Models\Service;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Notifications\GymLinkAccepted;
use App\Notifications\GymLinkRequested;
use App\Support\TrainerSlots;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** A trainer joins a gym: one side asks, the other accepts. */
class GymLinkTest extends TestCase
{
    use RefreshDatabase;

    private City $milano;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(CatalogSeeder::class);
        Notification::fake();
        $this->milano = City::where('slug', 'milano')->firstOrFail();
    }

    private function gym(): GymProfile
    {
        return GymProfile::factory()->approved()->inCity($this->milano)->create(['name' => 'FitLab']);
    }

    public function test_a_trainer_asks_and_the_gym_accepts()
    {
        $gym = $this->gym();
        $trainer = TrainerProfile::factory()->approved()->create();

        $this->actingAs($trainer->user)
            ->post(route('trainer.gyms.request', $gym->slug), ['message' => 'Alleno già qui il martedì'])
            ->assertRedirect();

        $link = GymTrainerLink::firstOrFail();
        $this->assertSame(GymLinkStatus::Pending, $link->status);
        $this->assertSame(GymLinkSide::Trainer, $link->initiated_by);
        Notification::assertSentTo($gym->user, GymLinkRequested::class);

        // The trainer can't accept the own request.
        $this->post(route('trainer.gyms.accept', $link))->assertSessionHasErrors('link');

        $this->actingAs($gym->user)
            ->get(route('gym.trainers'))
            ->assertInertia(fn (Assert $page) => $page->has('requests', 1)->where('gymArea.pendingCount', 1));

        $this->post(route('gym.trainers.accept', $link))->assertRedirect(route('gym.trainers'));

        $this->assertSame(GymLinkStatus::Accepted, $link->fresh()->status);
        Notification::assertSentTo($trainer->user, GymLinkAccepted::class);

        // The trainer gets a place in the gym: in person, and found in Milan.
        $place = $trainer->places()->where('type', PlaceType::Gym)->firstOrFail();
        $this->assertSame($gym->id, $place->gym_profile_id);
        $this->assertSame($this->milano->id, $place->city_id);
        $this->assertTrue($trainer->fresh()->trains_in_person);
        $this->assertTrue(TrainerProfile::query()->basedIn($this->milano->id)->whereKey($trainer->id)->exists());

        // Both profiles show the other one.
        $this->get(route('gyms.show', $gym->slug))
            ->assertInertia(fn (Assert $page) => $page
                ->has('gym.trainers', 1)
                ->where('gym.trainers.0.href', "/trainer/{$trainer->slug}?luogo={$place->id}")
            );
        $this->get(route('trainers.show', $trainer->slug))
            ->assertInertia(fn (Assert $page) => $page
                ->where('trainer.gyms.0.name', 'FitLab')
                ->where('trainer.places', fn ($places) => collect($places)->contains('title', 'FitLab'))
            );
    }

    public function test_a_gym_invites_and_either_side_can_remove()
    {
        $gym = $this->gym();
        $trainer = TrainerProfile::factory()->approved()->create();

        $this->actingAs($gym->user)
            ->post(route('gym.trainers.invite'), ['trainer' => $trainer->slug])
            ->assertRedirect(route('gym.trainers'));
        Notification::assertSentTo($trainer->user, GymLinkRequested::class);

        $link = GymTrainerLink::firstOrFail();
        $this->actingAs($trainer->user)->post(route('trainer.gyms.accept', $link))->assertRedirect();
        $this->assertSame(1, $trainer->places()->where('type', PlaceType::Gym)->count());

        $this->delete(route('trainer.gyms.destroy', $link))->assertRedirect();

        $this->assertDatabaseCount('gym_trainer', 0);
        $this->assertSame(0, $trainer->places()->where('type', PlaceType::Gym)->count());
        $this->assertFalse($trainer->fresh()->trains_in_person);
    }

    public function test_asking_when_the_other_side_already_asked_accepts()
    {
        $gym = $this->gym();
        $trainer = TrainerProfile::factory()->approved()->create();

        $this->actingAs($gym->user)->post(route('gym.trainers.invite'), ['trainer' => $trainer->slug]);
        $this->actingAs($trainer->user)->post(route('trainer.gyms.request', $gym->slug));

        $this->assertSame(GymLinkStatus::Accepted, GymTrainerLink::firstOrFail()->status);
    }

    public function test_after_a_no_the_same_side_waits_before_asking_again()
    {
        $gym = $this->gym();
        $trainer = TrainerProfile::factory()->approved()->create();

        $this->actingAs($trainer->user)->post(route('trainer.gyms.request', $gym->slug));
        $link = GymTrainerLink::firstOrFail();
        $this->actingAs($gym->user)->post(route('gym.trainers.decline', $link));

        $this->actingAs($trainer->user)->post(route('trainer.gyms.request', $gym->slug))->assertSessionHasErrors('link');

        $this->travel(31)->days();
        $this->post(route('trainer.gyms.request', $gym->slug))->assertSessionDoesntHaveErrors();
        $this->assertSame(GymLinkStatus::Pending, $link->fresh()->status);
    }

    public function test_someone_elses_link_is_not_found()
    {
        $gym = $this->gym();
        $trainer = TrainerProfile::factory()->approved()->create();
        $this->actingAs($trainer->user)->post(route('trainer.gyms.request', $gym->slug));
        $link = GymTrainerLink::firstOrFail();

        $this->actingAs(GymProfile::factory()->approved()->create()->user)
            ->post(route('gym.trainers.accept', $link))->assertNotFound();
        $this->actingAs(TrainerProfile::factory()->approved()->create()->user)
            ->delete(route('trainer.gyms.destroy', $link))->assertNotFound();
    }

    public function test_a_gym_in_review_cant_be_asked_or_invite()
    {
        $gym = GymProfile::factory()->create();
        $trainer = TrainerProfile::factory()->approved()->create();

        $this->actingAs($trainer->user)->post(route('trainer.gyms.request', $gym->slug))->assertNotFound();
        $this->actingAs($gym->user)->post(route('gym.trainers.invite'), ['trainer' => $trainer->slug])->assertSessionHasErrors('trainer');
        $this->assertDatabaseCount('gym_trainer', 0);
    }

    public function test_the_registration_asks_the_gyms_and_they_hear_after_the_approval()
    {
        $gym = $this->gym();
        $trainer = TrainerProfile::factory()->status(TrainerProfileStatus::Review)->create();

        $this->actingAs($trainer->user)->post(route('trainer.gyms.request', $gym->slug));
        Notification::assertNothingSent();

        // Hidden from the gym until the trainer is approved.
        $this->actingAs($gym->user)->get(route('gym.trainers'))
            ->assertInertia(fn (Assert $page) => $page->has('requests', 0));

        $this->actingAs(User::factory()->admin()->create())
            ->post(route('admin.verification.decide', $trainer), ['decision' => 'approved']);

        Notification::assertSentTo($gym->user, GymLinkRequested::class);
    }

    public function test_the_booking_copies_the_gym_chosen_as_place()
    {
        $gym = $this->gym();
        $trainer = TrainerProfile::factory()->approved()->inCity($this->milano)->bookable()->create();
        $this->actingAs($gym->user)->post(route('gym.trainers.invite'), ['trainer' => $trainer->slug]);
        $this->actingAs($trainer->user)->post(route('trainer.gyms.accept', GymTrainerLink::firstOrFail()));
        $place = $trainer->places()->where('type', PlaceType::Gym)->firstOrFail();

        $slot = collect(TrainerSlots::days($trainer->fresh('workingHours'), 7))->pluck('slots')->flatten(1)->first();
        $service = Service::where('trainer_profile_id', $trainer->id)->where('minutes', 60)->firstOrFail();

        $this->actingAs(User::factory()->create())->post(route('trainers.book', $trainer->slug), [
            'service_id' => $service->id,
            'start' => $slot['start'],
            'minutes' => 60,
            'place_id' => $place->id,
        ])->assertSessionHasNoErrors();

        $this->assertSame('FitLab · Milano', Booking::firstOrFail()->place_label);

        // Another trainer's place is refused.
        $other = TrainerProfile::factory()->approved()->inCity($this->milano)->create();
        $this->post(route('trainers.book', $trainer->slug), [
            'service_id' => $service->id,
            'start' => $slot['start'],
            'minutes' => 60,
            'place_id' => $other->places()->value('id'),
        ])->assertSessionHasErrors('place_id');
    }

    public function test_deleting_a_gym_takes_it_off_the_trainers()
    {
        $gym = $this->gym();
        $trainer = TrainerProfile::factory()->approved()->create();
        $this->actingAs($gym->user)->post(route('gym.trainers.invite'), ['trainer' => $trainer->slug]);
        $this->actingAs($trainer->user)->post(route('trainer.gyms.accept', GymTrainerLink::firstOrFail()));

        app(DeleteUser::class)->handle($gym->user);

        $this->assertSame(0, $trainer->places()->count());
        $this->assertFalse($trainer->fresh()->trains_in_person);
    }
}
