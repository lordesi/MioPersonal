<?php

namespace Tests\Unit;

use App\Models\ActivityLog;
use App\Models\BodyMeasurement;
use App\Models\Booking;
use App\Models\BookingSeries;
use App\Models\GymCourse;
use App\Models\GymPhoto;
use App\Models\GymProfile;
use App\Models\GymPromotion;
use App\Models\GymTrainerLink;
use App\Models\Review;
use App\Models\TrainerClient;
use App\Models\TrainerPhoto;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Policies\ActivityLogPolicy;
use App\Policies\BodyMeasurementPolicy;
use App\Policies\BookingPolicy;
use App\Policies\BookingSeriesPolicy;
use App\Policies\GymCoursePolicy;
use App\Policies\GymPhotoPolicy;
use App\Policies\GymPromotionPolicy;
use App\Policies\GymTrainerLinkPolicy;
use App\Policies\ReviewPolicy;
use App\Policies\TrainerClientPolicy;
use App\Policies\TrainerPhotoPolicy;
use Illuminate\Auth\Access\Response;
use Illuminate\Database\Eloquent\Model;
use Tests\TestCase;

/** The policies of app/Policies: the owner passes, anyone else gets a 404. */
class OwnershipPoliciesTest extends TestCase
{
    public function test_a_booking_belongs_to_its_client_and_its_trainer()
    {
        $booking = $this->record(Booking::class, ['client_id' => 10, 'trainer_profile_id' => 7]);
        $policy = new BookingPolicy;

        $this->assertAllowed($policy->asClient($this->user(10), $booking));
        $this->assertNotFound($policy->asClient($this->user(11), $booking));
        $this->assertAllowed($policy->asTrainer($this->trainer(7), $booking));
        $this->assertNotFound($policy->asTrainer($this->trainer(8), $booking));
        // The client is not the trainer, and an account without a trainer profile is nobody's trainer.
        $this->assertNotFound($policy->asTrainer($this->user(10), $booking));
    }

    public function test_a_booking_without_a_client_belongs_to_no_client()
    {
        $booking = $this->record(Booking::class, ['client_id' => null, 'trainer_profile_id' => 7]);

        $this->assertNotFound((new BookingPolicy)->asClient($this->user(10), $booking));
    }

    public function test_the_records_of_a_trainer()
    {
        $this->assertOwnedByTrainer(fn (User $user, Model $record) => (new BookingSeriesPolicy)->asTrainer($user, $record), BookingSeries::class);
        $this->assertOwnedByTrainer(fn (User $user, Model $record) => (new TrainerClientPolicy)->asTrainer($user, $record), TrainerClient::class);
        $this->assertOwnedByTrainer(fn (User $user, Model $record) => (new ReviewPolicy)->asTrainer($user, $record), Review::class);
        $this->assertOwnedByTrainer(fn (User $user, Model $record) => (new TrainerPhotoPolicy)->asTrainer($user, $record), TrainerPhoto::class);
        $this->assertOwnedByTrainer(fn (User $user, Model $record) => (new GymTrainerLinkPolicy)->asTrainer($user, $record), GymTrainerLink::class);
    }

    public function test_the_records_of_a_gym()
    {
        $this->assertOwnedByGym(fn (User $user, Model $record) => (new GymCoursePolicy)->asGym($user, $record), GymCourse::class);
        $this->assertOwnedByGym(fn (User $user, Model $record) => (new GymPhotoPolicy)->asGym($user, $record), GymPhoto::class);
        $this->assertOwnedByGym(fn (User $user, Model $record) => (new GymPromotionPolicy)->asGym($user, $record), GymPromotion::class);
        $this->assertOwnedByGym(fn (User $user, Model $record) => (new GymTrainerLinkPolicy)->asGym($user, $record), GymTrainerLink::class);
    }

    public function test_the_progress_of_a_client()
    {
        $log = $this->record(ActivityLog::class, ['user_id' => 10]);
        $weight = $this->record(BodyMeasurement::class, ['user_id' => 10]);

        $this->assertAllowed((new ActivityLogPolicy)->asClient($this->user(10), $log));
        $this->assertNotFound((new ActivityLogPolicy)->asClient($this->user(11), $log));
        $this->assertAllowed((new BodyMeasurementPolicy)->asClient($this->user(10), $weight));
        $this->assertNotFound((new BodyMeasurementPolicy)->asClient($this->user(11), $weight));
    }

    public function test_a_conversation_is_only_of_the_trainer_and_the_client_with_an_account()
    {
        $policy = new TrainerClientPolicy;
        $record = $this->record(TrainerClient::class, ['trainer_profile_id' => 7, 'user_id' => 10]);

        $this->assertAllowed($policy->converse($this->user(10), $record));
        $this->assertAllowed($policy->converse($this->trainer(7), $record));
        $this->assertNotFound($policy->converse($this->user(11), $record));
        $this->assertNotFound($policy->converse($this->trainer(8), $record));

        // Someone without an account: no conversation, not even for the trainer.
        $offline = $this->record(TrainerClient::class, ['trainer_profile_id' => 7, 'user_id' => null]);
        $this->assertNotFound($policy->converse($this->trainer(7), $offline));
    }

    /**
     * @param  \Closure(User, Model): Response  $check
     * @param  class-string<Model>  $class
     */
    private function assertOwnedByTrainer(\Closure $check, string $class): void
    {
        $record = $this->record($class, ['trainer_profile_id' => 7]);

        $this->assertAllowed($check($this->trainer(7), $record), $class);
        $this->assertNotFound($check($this->trainer(8), $record), $class);
        $this->assertNotFound($check($this->user(10), $record), $class);
    }

    /**
     * @param  \Closure(User, Model): Response  $check
     * @param  class-string<Model>  $class
     */
    private function assertOwnedByGym(\Closure $check, string $class): void
    {
        $record = $this->record($class, ['gym_profile_id' => 3]);

        $this->assertAllowed($check($this->gym(3), $record), $class);
        $this->assertNotFound($check($this->gym(4), $record), $class);
        $this->assertNotFound($check($this->user(10), $record), $class);
    }

    /**
     * @template T of Model
     *
     * @param  class-string<T>  $class
     * @param  array<string, mixed>  $attributes
     * @return T
     */
    private function record(string $class, array $attributes): Model
    {
        return (new $class)->forceFill($attributes);
    }

    private function user(int $id): User
    {
        $user = (new User)->forceFill(['id' => $id]);

        return $user->setRelation('trainerProfile', null)->setRelation('gymProfile', null);
    }

    private function trainer(int $profileId): User
    {
        return $this->user(100 + $profileId)->setRelation('trainerProfile', (new TrainerProfile)->forceFill(['id' => $profileId]));
    }

    private function gym(int $profileId): User
    {
        return $this->user(200 + $profileId)->setRelation('gymProfile', (new GymProfile)->forceFill(['id' => $profileId]));
    }

    private function assertAllowed(Response $response, string $message = ''): void
    {
        $this->assertTrue($response->allowed(), $message);
    }

    private function assertNotFound(Response $response, string $message = ''): void
    {
        $this->assertTrue($response->denied(), $message);
        $this->assertSame(404, $response->status(), $message);
    }
}
