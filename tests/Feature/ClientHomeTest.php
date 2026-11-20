<?php

namespace Tests\Feature;

use App\Enums\BookingStatus;
use App\Enums\RegistrationStatus;
use App\Enums\TrainingMode;
use App\Models\Booking;
use App\Models\City;
use App\Models\Discipline;
use App\Models\GroupSession;
use App\Models\GymProfile;
use App\Models\TrainerClient;
use App\Models\TrainerProfile;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** "Home", the first page of the client area: the week, the day, trainers and gyms to try. */
class ClientHomeTest extends TestCase
{
    use RefreshDatabase;

    private function rome(string $time): CarbonImmutable
    {
        return CarbonImmutable::parse($time, 'Europe/Rome');
    }

    public function test_guests_are_redirected_to_the_login_page()
    {
        $this->get(route('client.home'))->assertRedirect(route('login'));
    }

    public function test_trainers_are_sent_to_their_area()
    {
        $this->actingAs(User::factory()->trainer()->create())
            ->get(route('client.home'))
            ->assertRedirect(route('trainer.today'));
    }

    /** No sample data: a new account has an empty week and gets trainers and gyms to try. */
    public function test_a_new_account_sees_an_empty_week_and_some_suggestions()
    {
        $this->travelTo($this->rome('2026-11-18 10:00'));
        Booking::factory()->confirmed()->at($this->rome('2026-11-18 18:00'))->create();
        $trainer = TrainerProfile::factory()->approved()->create();
        $gym = GymProfile::factory()->approved()->create();
        GymProfile::factory()->create();
        $client = User::factory()->create(['first_name' => 'Marta']);

        $this->actingAs($client)
            ->get(route('client.home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('client/home')
                ->where('firstName', 'Marta')
                ->where('today', '2026-11-18')
                ->where('day', '2026-11-18')
                ->has('week', 7)
                ->where('week.0', ['date' => '2026-11-16', 'count' => 0])
                ->where('week.6', ['date' => '2026-11-22', 'count' => 0])
                ->has('dayBookings', 0)
                // The booking above brings its trainer too.
                ->where('trainers', fn ($trainers) => collect($trainers)->pluck('slug')->contains($trainer->slug))
                // Only the published gyms.
                ->has('gyms', 1)
                ->where('gyms.0.slug', $gym->slug)
                ->where('gyms.0.favorite', false)
            );
    }

    public function test_the_week_and_the_day_show_sessions_as_a_friend_and_events()
    {
        $this->travelTo($this->rome('2026-11-18 10:00'));
        $client = User::factory()->create();
        $trainer = TrainerProfile::factory()->approved()->create();
        $booking = fn () => Booking::factory()->for($client, 'client')->for($trainer);

        $own = $booking()->confirmed()->at($this->rome('2026-11-18 18:30'))->create(['place_label' => 'Via Padova 12, Milano']);
        // Waiting for the trainer, the day after.
        $waiting = $booking()->at($this->rome('2026-11-19 07:30'))->create();
        // Refused or cancelled: not in the week.
        $booking()->status(BookingStatus::Declined)->at($this->rome('2026-11-18 12:00'))->create();
        $booking()->status(BookingStatus::Cancelled)->at($this->rome('2026-11-20 12:00'))->create();
        // Another week.
        $booking()->confirmed()->at($this->rome('2026-11-25 18:00'))->create();

        // A friend's session the client joined ("Invita un amico").
        $friends = Booking::factory()->confirmed()->for($trainer)->at($this->rome('2026-11-18 20:00'))->create(['people' => 2]);
        $friends->guests()->create(['user_id' => $client->id]);

        $event = GroupSession::factory()->by($trainer)->create([
            'title' => 'Yoga al parco',
            'starts_at' => $this->rome('2026-11-18 21:00'),
            'ends_at' => $this->rome('2026-11-18 22:00'),
        ]);
        $event->registrations()->create(['user_id' => $client->id, 'status' => RegistrationStatus::Registered]);
        // A place given back is not shown.
        $gaveBack = GroupSession::factory()->by($trainer)->create([
            'starts_at' => $this->rome('2026-11-21 09:00'),
            'ends_at' => $this->rome('2026-11-21 10:00'),
        ]);
        $gaveBack->registrations()->create(['user_id' => $client->id, 'status' => RegistrationStatus::Cancelled]);

        // "Scrivi": the trainer has the client in "Clienti".
        $record = TrainerClient::query()->forceCreate([
            'trainer_profile_id' => $trainer->id,
            'user_id' => $client->id,
            'name' => 'Marta Bianchi',
        ]);

        $this->actingAs($client)
            ->get(route('client.home'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('week.2', ['date' => '2026-11-18', 'count' => 3])
                ->where('week.3', ['date' => '2026-11-19', 'count' => 1])
                ->where('week.4', ['date' => '2026-11-20', 'count' => 0])
                ->where('week.5', ['date' => '2026-11-21', 'count' => 0])
                ->has('dayBookings', 3)
                ->where('dayBookings.0.key', 'booking-'.$own->id)
                ->where('dayBookings.0.kind', 'trainer')
                ->where('dayBookings.0.title', $trainer->user->name)
                ->where('dayBookings.0.status', 'confirmed')
                ->where('dayBookings.0.placeLabel', 'Via Padova 12, Milano')
                ->where('dayBookings.0.packageLabel', null)
                ->where('dayBookings.0.start', '2026-11-18T17:30:00Z')
                ->where('dayBookings.0.messageHref', route('client.messages', ['con' => $record->id], false))
                ->where('dayBookings.1.key', 'booking-'.$friends->id)
                ->where('dayBookings.2.key', 'event-'.$event->id)
                ->where('dayBookings.2.kind', 'event')
                ->where('dayBookings.2.messageHref', null)
                ->where('dayBookings.2.detailsHref', route('events.show', $event->slug, false))
            );

        $this->actingAs($client)
            ->get(route('client.home', ['giorno' => '2026-11-19']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('day', '2026-11-19')
                ->has('dayBookings', 1)
                ->where('dayBookings.0.key', 'booking-'.$waiting->id)
                ->where('dayBookings.0.status', 'pending')
            );
    }

    public function test_a_wrong_or_far_day_falls_back_to_today()
    {
        $this->travelTo($this->rome('2026-11-18 10:00'));
        $this->actingAs(User::factory()->create());

        foreach (['2026-02-30', 'domani', '2028-11-18'] as $value) {
            $this->get(route('client.home', ['giorno' => $value]))
                ->assertInertia(fn (Assert $page) => $page->where('day', '2026-11-18'));
        }

        $this->get(route('client.home', ['giorno' => '2026-12-01']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('day', '2026-12-01')
                ->where('week.0.date', '2026-11-30'));
    }

    public function test_recommended_trainers_follow_the_client_preferences()
    {
        $milano = City::factory()->create(['slug' => 'milano']);
        $roma = City::factory()->create(['slug' => 'roma']);
        $yoga = Discipline::factory()->create(['slug' => 'yoga']);
        Discipline::factory()->create(['slug' => 'boxe']);

        $client = User::factory()->create();
        $client->clientPreference()->create([
            'city_id' => $milano->id,
            'mode' => TrainingMode::InPerson,
            'discipline_ids' => [$yoga->id],
        ]);

        $yogaInMilano = TrainerProfile::factory()->approved()->inCity($milano)->withDisciplines(['yoga'])->create();
        $boxeInMilano = TrainerProfile::factory()->approved()->inCity($milano)->withDisciplines(['boxe'])->create();
        // Other city, online only, not approved: never recommended.
        TrainerProfile::factory()->approved()->inCity($roma)->withDisciplines(['yoga'])->create();
        TrainerProfile::factory()->approved()->withDisciplines(['yoga'])->create();
        TrainerProfile::factory()->inCity($milano)->withDisciplines(['yoga'])->create();

        // The gyms of the client's city.
        $gymInMilano = GymProfile::factory()->approved()->inCity($milano)->create();
        GymProfile::factory()->approved()->inCity($roma)->create();

        $this->actingAs($client)
            ->get(route('client.home'))
            ->assertInertia(fn (Assert $page) => $page
                // Yoga first, then the other trainers of the city fill the row.
                ->has('trainers', 2)
                ->where('trainers.0.slug', $yogaInMilano->slug)
                ->where('trainers.1.slug', $boxeInMilano->slug)
                ->has('gyms', 1)
                ->where('gyms.0.slug', $gymInMilano->slug)
            );
    }

    public function test_up_to_six_trainers_and_gyms_are_suggested()
    {
        TrainerProfile::factory()->approved()->count(8)->create();
        GymProfile::factory()->approved()->count(8)->create();

        $this->actingAs(User::factory()->create())
            ->get(route('client.home'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('trainers', 6)
                ->has('gyms', 6)
            );
    }

    public function test_the_highest_budget_means_no_limit()
    {
        $client = User::factory()->create();
        $client->clientPreference()->create(['budget_max_cents' => 10000]);

        $expensive = TrainerProfile::factory()->approved()->create(['price_from_cents' => 12000]);

        $this->actingAs($client)
            ->get(route('client.home'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('trainers', 1)
                ->where('trainers.0.slug', $expensive->slug)
            );
    }
}
