<?php

namespace Tests\Feature;

use App\Enums\BookingActor;
use App\Enums\BookingStatus;
use App\Enums\RegistrationStatus;
use App\Enums\TrainingMode;
use App\Models\Booking;
use App\Models\City;
use App\Models\Discipline;
use App\Models\GroupSession;
use App\Models\TrainerProfile;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** "Panoramica", the first page of the client area. */
class ClientHomeTest extends TestCase
{
    use RefreshDatabase;

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

    /** No sample data: a new account has nothing done and gets a few trainers to try. */
    public function test_a_new_account_sees_an_empty_overview_and_some_trainers()
    {
        Booking::factory()->confirmed()->at(CarbonImmutable::now()->subDay())->create();
        $recommended = TrainerProfile::factory()->approved()->create();
        $client = User::factory()->create(['first_name' => 'Marta']);

        $this->actingAs($client)
            ->get(route('client.home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('client/home')
                ->where('firstName', 'Marta')
                ->where('next', null)
                ->where('toAnswer', 0)
                ->where('progress.total', 0)
                ->where('progress.thisWeek', 0)
                ->where('progress.streak', 0)
                ->has('progress.weeks', 12)
                ->has('progress.recent', 0)
                ->has('trainers', 0)
                ->where('recommended', fn ($trainers) => collect($trainers)->pluck('slug')->contains($recommended->slug))
                ->where('hasPreferences', false)
            );
    }

    public function test_the_next_session_and_what_waits_for_an_answer()
    {
        $client = User::factory()->create();
        $trainer = TrainerProfile::factory()->approved()->create();
        $tomorrow = CarbonImmutable::now()->addDay()->startOfHour();
        $booking = fn () => Booking::factory()->for($client, 'client')->for($trainer);

        $next = $booking()->confirmed()->at($tomorrow)->create();
        // "Sposta": the trainer proposes another time.
        $booking()->confirmed()->at($tomorrow->addDays(2))->create([
            'proposed_starts_at' => $tomorrow->addDays(3),
            'proposal_expires_at' => $tomorrow,
        ]);
        $booking()->status(BookingStatus::Cancelled)->at($tomorrow->addDays(4))->create(['cancelled_by' => BookingActor::Trainer]);
        // Waiting for the trainer: nothing for the client to do.
        $booking()->at($tomorrow->addDays(5))->create();

        $this->actingAs($client)
            ->get(route('client.home'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('next.id', $next->id)
                ->where('toAnswer', 2)
                // With a trainer of their own, no recommendations.
                ->has('trainers', 1)
                ->has('recommended', 0)
            );
    }

    public function test_sessions_done_and_events_attended_count_by_themselves()
    {
        $this->travelTo(CarbonImmutable::parse('2026-11-12 10:00', 'Europe/Rome'));
        $client = User::factory()->create();
        $trainer = TrainerProfile::factory()->approved()->create();
        $booking = fn () => Booking::factory()->for($client, 'client')->for($trainer);

        $booking()->confirmed()->at(CarbonImmutable::parse('2026-11-10 18:00', 'Europe/Rome'))->create();
        $booking()->confirmed()->at(CarbonImmutable::parse('2026-11-03 18:00', 'Europe/Rome'))->create();
        // "Saltata" is only for the trainer: the client still sees it as done.
        $booking()->confirmed()->at(CarbonImmutable::parse('2026-10-27 18:00', 'Europe/Rome'))->create(['no_show_at' => now()]);
        // Not done: still to come, refused, cancelled.
        $booking()->confirmed()->at(CarbonImmutable::parse('2026-11-13 18:00', 'Europe/Rome'))->create();
        $booking()->status(BookingStatus::Declined)->at(CarbonImmutable::parse('2026-11-09 18:00', 'Europe/Rome'))->create();
        $booking()->status(BookingStatus::Cancelled)->at(CarbonImmutable::parse('2026-11-11 18:00', 'Europe/Rome'))->create();

        $event = GroupSession::factory()->by($trainer)->create([
            'title' => 'Yoga al parco',
            'starts_at' => CarbonImmutable::parse('2026-11-11 08:00', 'Europe/Rome'),
            'ends_at' => CarbonImmutable::parse('2026-11-11 09:00', 'Europe/Rome'),
        ]);
        $event->registrations()->create(['user_id' => $client->id, 'status' => RegistrationStatus::Registered]);
        // A place given back doesn't count.
        $gaveBack = GroupSession::factory()->by($trainer)->create([
            'starts_at' => CarbonImmutable::parse('2026-11-04 08:00', 'Europe/Rome'),
            'ends_at' => CarbonImmutable::parse('2026-11-04 09:00', 'Europe/Rome'),
        ]);
        $gaveBack->registrations()->create(['user_id' => $client->id, 'status' => RegistrationStatus::Cancelled]);

        $this->actingAs($client)
            ->get(route('client.home'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('progress.thisWeek', 2)
                ->where('progress.thisMonth', 3)
                ->where('progress.total', 4)
                // Three weeks in a row with at least one training.
                ->where('progress.streak', 3)
                ->where('progress.weeks.11', ['start' => '2026-11-09', 'count' => 2])
                ->where('progress.weeks.10', ['start' => '2026-11-02', 'count' => 1])
                ->where('progress.recent.0.date', '2026-11-11')
                ->where('progress.recent.0.label', 'Yoga al parco')
                ->where('progress.recent.0.source', 'event')
                ->where('progress.recent.1.source', 'session')
            );
    }

    public function test_your_trainers_replace_the_recommendations()
    {
        $client = User::factory()->create();
        $favorite = TrainerProfile::factory()->approved()->create();
        $client->favoriteTrainers()->attach($favorite, ['created_at' => now()]);

        $this->actingAs($client)
            ->get(route('client.home'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('trainers', 1)
                ->where('trainers.0.slug', $favorite->slug)
                ->has('recommended', 0)
            );
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

        $this->actingAs($client)
            ->get(route('client.home'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('hasPreferences', true)
                // Yoga first, then the other trainers of the city fill the row.
                ->has('recommended', 2)
                ->where('recommended.0.slug', $yogaInMilano->slug)
                ->where('recommended.1.slug', $boxeInMilano->slug)
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
                ->has('recommended', 1)
                ->where('recommended.0.slug', $expensive->slug)
            );
    }
}
