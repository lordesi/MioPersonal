<?php

namespace Tests\Feature;

use App\Enums\TrainingMode;
use App\Models\Booking;
use App\Models\City;
use App\Models\Discipline;
use App\Models\TrainerProfile;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

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

    public function test_a_new_account_sees_nothing_booked()
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
                ->where('upcomingCount', 0)
                ->where('nextBooking', null)
                ->has('pending', 0)
                ->has('favorites', 0)
                ->where('hasPreferences', false)
                ->where('citySlug', null)
            );
    }

    public function test_the_next_session_is_the_first_confirmed_one()
    {
        $client = User::factory()->create();
        $trainer = TrainerProfile::factory()->approved()->create();
        $tomorrow = CarbonImmutable::now('Europe/Rome')->startOfDay()->addDay()->setTime(18, 0);
        $booking = fn () => Booking::factory()->for($client, 'client')->for($trainer);

        $booking()->confirmed()->at($tomorrow->subDays(3))->create();
        $booking()->confirmed()->at($tomorrow->addDays(2))->create();
        $next = $booking()->confirmed()->at($tomorrow)->create();
        $booking()->at($tomorrow->addHours(3))->create();

        $this->actingAs($client)
            ->get(route('client.home'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('upcomingCount', 2)
                ->where('nextBooking.id', $next->id)
                ->where('nextBooking.start', $tomorrow->utc()->format('Y-m-d\TH:i:s\Z'))
                ->has('pending', 1)
                ->where('pending.0.status', 'pending')
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
        // Other city, online only, favorite, not approved: never recommended.
        TrainerProfile::factory()->approved()->inCity($roma)->withDisciplines(['yoga'])->create();
        TrainerProfile::factory()->approved()->withDisciplines(['yoga'])->create();
        $favorite = TrainerProfile::factory()->approved()->inCity($milano)->withDisciplines(['yoga'])->create();
        $client->favoriteTrainers()->attach($favorite, ['created_at' => now()]);
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
                ->has('favorites', 1)
            );
    }
}
