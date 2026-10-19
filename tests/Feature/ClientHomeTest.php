<?php

namespace Tests\Feature;

use App\Enums\BookingStatus;
use App\Enums\TrainingMode;
use App\Models\Booking;
use App\Models\City;
use App\Models\Discipline;
use App\Models\Review;
use App\Models\TrainerProfile;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** "Le mie prenotazioni", the dashboard of the client area. */
class ClientHomeTest extends TestCase
{
    use RefreshDatabase;

    private const UTC_ISO = '/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/';

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

    /** The old address of "Le mie prenotazioni", still in the links already sent. */
    public function test_the_old_bookings_page_leads_to_the_dashboard()
    {
        $this->actingAs(User::factory()->create())
            ->get(route('client.bookings'))
            ->assertRedirect(route('client.home'));
    }

    /** No sample data: a new account has nothing booked and nothing saved. */
    public function test_a_new_account_sees_every_section_empty()
    {
        // Someone else's booking is never shown.
        Booking::factory()->confirmed()->create();
        $client = User::factory()->create(['first_name' => 'Marta']);

        $this->actingAs($client)
            ->get(route('client.home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('client/home')
                ->where('firstName', 'Marta')
                ->has('upcoming', 0)
                ->has('pending', 0)
                ->has('past', 0)
                ->has('packages', 0)
                ->has('trainers', 0)
                ->where('hasPreferences', false)
                ->where('citySlug', null)
            );
    }

    public function test_each_booking_goes_in_its_section()
    {
        $client = User::factory()->create();
        $trainer = TrainerProfile::factory()->approved()->create(['free_cancellation_hours' => 24]);
        $tomorrow = CarbonImmutable::now('Europe/Rome')->startOfDay()->addDay()->setTime(18, 0);
        $booking = fn () => Booking::factory()->for($client, 'client')->for($trainer);

        $later = $booking()->confirmed()->at($tomorrow->addDays(2))->create();
        $next = $booking()->confirmed()->at($tomorrow)->create();
        $booking()->at($tomorrow->addHours(2))->create();
        $booking()->status(BookingStatus::Declined)->at($tomorrow->addDay())->create();
        $booking()->expired()->at($tomorrow->addDays(2))->create();
        $booking()->status(BookingStatus::Cancelled)->at($tomorrow->addDays(3))->create();
        $done = $booking()->confirmed()->at($tomorrow->subDays(3))->create();
        // Marked "Saltata" by the trainer: the client still sees it, but can't review it.
        $missed = $booking()->confirmed()->at($tomorrow->subDays(4))->create(['no_show_at' => now()]);

        $this->actingAs($client)
            ->get(route('client.home'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('upcoming', 2)
                ->where('upcoming.0.id', $next->id)
                ->where('upcoming.0.status', 'confirmed')
                ->where('upcoming.0.hours', 1)
                ->where('upcoming.0.serviceLabel', 'Seduta singola')
                ->where('upcoming.0.trainerName', $trainer->user->name)
                ->where('upcoming.0.start', $tomorrow->utc()->format('Y-m-d\TH:i:s\Z'))
                ->where('upcoming.0.freeCancellationUntil', $tomorrow->subDay()->utc()->format('Y-m-d\TH:i:s\Z'))
                ->where('upcoming.0.calendarHref', route('client.bookings.calendar', $next, false))
                ->where('upcoming.1.id', $later->id)
                ->has('pending', 3)
                ->where('pending.0.status', 'pending')
                ->where('pending.1.status', 'declined')
                ->where('pending.2.status', 'expired')
                ->where('pending.2.expiresAt', null)
                // Cancelled bookings are not listed.
                ->has('past', 2)
                ->where('past.0.id', $done->id)
                ->where('past.0.review', null)
                ->where('past.0.canReview', true)
                ->where('past.1.id', $missed->id)
                ->where('past.1.canReview', false)
            );
    }

    public function test_a_session_done_shows_the_review_left()
    {
        $client = User::factory()->create();
        $trainer = TrainerProfile::factory()->approved()->create();
        $done = Booking::factory()->for($client, 'client')->for($trainer)->confirmed()->at(CarbonImmutable::now()->subDays(2))->create();
        Review::factory()->for($trainer)->create([
            'booking_id' => $done->id,
            'client_id' => $client->id,
            'rating' => 4,
            'text' => 'Molto preparato.',
        ]);

        $this->actingAs($client)
            ->get(route('client.home'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('past.0.review', ['rating' => 4, 'text' => 'Molto preparato.'])
                ->where('past.0.canReview', false)
            );
    }

    public function test_your_trainers_are_the_booked_ones_then_the_favorites()
    {
        Discipline::factory()->create(['slug' => 'yoga', 'name' => 'Yoga']);
        $client = User::factory()->create();
        $booked = TrainerProfile::factory()->approved()->withDisciplines(['yoga'])->create();
        $favorite = TrainerProfile::factory()->approved()->create(['next_free_slot_at' => now()->addDay()]);
        $notApproved = TrainerProfile::factory()->create();
        Booking::factory()->for($client, 'client')->for($booked)->confirmed()->at(CarbonImmutable::now()->subDay())->create();
        // Only a request: not one of "your" trainers yet.
        Booking::factory()->for($client, 'client')->for(TrainerProfile::factory()->approved())->at(CarbonImmutable::now()->addDay())->create();
        $client->favoriteTrainers()->attach($favorite, ['created_at' => now()]);
        $client->favoriteTrainers()->attach($notApproved, ['created_at' => now()]);

        $this->actingAs($client)
            ->get(route('client.home'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('trainers', 2)
                ->where('trainers.0.href', route('trainers.show', $booked->slug, false))
                ->where('trainers.0.booked', true)
                ->where('trainers.0.favorite', false)
                ->where('trainers.0.discipline', 'Yoga')
                ->where('trainers.1.href', route('trainers.show', $favorite->slug, false))
                ->where('trainers.1.booked', false)
                ->where('trainers.1.favorite', true)
                // With trainers of their own, no recommendations.
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
                ->where('citySlug', 'milano')
                // Yoga first, then the other trainers of the city fill the row.
                ->has('recommended', 2)
                ->where('recommended.0.slug', $yogaInMilano->slug)
                ->where('recommended.1.slug', $boxeInMilano->slug)
            );
    }

    public function test_booking_times_are_utc_iso_strings()
    {
        $client = User::factory()->create();
        Booking::factory()->for($client, 'client')->create();
        $client->favoriteTrainers()->attach(
            TrainerProfile::factory()->approved()->create(['next_free_slot_at' => now()->addDay()]),
            ['created_at' => now()],
        );

        $this->actingAs($client)
            ->get(route('client.home'))
            ->assertInertia(function (Assert $page) {
                $props = $page->toArray()['props'];

                $this->assertMatchesRegularExpression(self::UTC_ISO, $props['pending'][0]['start']);
                $this->assertMatchesRegularExpression(self::UTC_ISO, $props['pending'][0]['expiresAt']);
                $this->assertMatchesRegularExpression(self::UTC_ISO, $props['trainers'][0]['nextSlotStart']);
            });
    }
}
