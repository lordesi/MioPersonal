<?php

namespace Tests\Feature;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\ClientPackage;
use App\Models\TrainerProfile;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** "Profilo" of the client area: the client's pages, the account and the help. */
class ClientProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_only_clients_open_it()
    {
        $this->get(route('client.profile'))->assertRedirect(route('login'));

        $this->actingAs(User::factory()->trainer()->create())
            ->get(route('client.profile'))
            ->assertRedirect(route('trainer.today'));
    }

    public function test_the_numbers_next_to_bookings_packages_and_favorites()
    {
        $client = User::factory()->create();
        $trainer = TrainerProfile::factory()->approved()->create();
        $booking = fn () => Booking::factory()->for($client, 'client')->for($trainer);
        $tomorrow = CarbonImmutable::now()->addDay()->startOfHour();

        $booking()->confirmed()->at($tomorrow)->create();
        $booking()->confirmed()->at($tomorrow->addDay())->create();
        // Over, waiting or cancelled: not counted.
        $booking()->confirmed()->at($tomorrow->subDays(3))->create();
        $booking()->at($tomorrow->addDays(2))->create();
        $booking()->status(BookingStatus::Cancelled)->at($tomorrow->addDays(3))->create();
        // A friend's session the client joined.
        $friends = Booking::factory()->confirmed()->for($trainer)->at($tomorrow->addDays(4))->create(['people' => 2]);
        $friends->guests()->create(['user_id' => $client->id]);

        ClientPackage::factory()->for($client, 'client')->for($trainer)->create();
        $client->favoriteTrainers()->attach($trainer, ['created_at' => now()]);

        $this->actingAs($client)
            ->get(route('client.profile'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('client/profile')
                ->where('upcomingCount', 3)
                ->where('activePackages', 1)
                ->where('auth.favoritesCount', 1)
            );
    }

    public function test_the_edit_page_has_its_own_address()
    {
        $this->actingAs(User::factory()->create())
            ->get(route('client.profile.edit'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('client/edit-profile'));
    }
}
