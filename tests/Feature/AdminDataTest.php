<?php

namespace Tests\Feature;

use App\Enums\BookingActor;
use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Review;
use App\Models\TrainerProfile;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** The admin pages read the real users, bookings and reviews. */
class AdminDataTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->admin()->create();
    }

    public function test_users_lists_the_real_clients_and_trainers()
    {
        $admin = $this->admin();
        $client = User::factory()->create(['first_name' => 'Anna', 'last_name' => 'Bianchi']);
        $profile = TrainerProfile::factory()->approved()->create(['rating_count' => 2, 'rating_sum' => 9]);
        Booking::factory()->count(2)->create(['client_id' => $client->id]);

        $this->actingAs($admin)
            ->get(route('admin.users'))
            ->assertInertia(fn (Assert $page) => $page
                // The trainers of the two bookings were made by the factory too.
                ->where('clients', fn ($clients) => collect($clients)->pluck('email')->all() === [$client->email])
                ->where('clients.0.name', 'Anna Bianchi')
                ->where('clients.0.bookingCount', 2)
                ->where('clients.0.suspended', false)
                ->where('trainers', fn ($trainers) => collect($trainers)->contains(fn ($t) => $t['email'] === $profile->user->email
                    && $t['profileStatus'] === 'approved'
                    && $t['reviewCount'] === 2
                    && $t['rating'] === 4.5))
            );
    }

    public function test_the_search_box_filters_users_by_name_or_email()
    {
        $admin = $this->admin();
        User::factory()->create(['first_name' => 'Anna', 'last_name' => 'Bianchi']);
        User::factory()->create(['first_name' => 'Paolo', 'last_name' => 'Verdi']);

        $this->actingAs($admin)
            ->get(route('admin.users', ['cerca' => 'anna']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('search', 'anna')
                ->has('clients', 1)
                ->where('clients.0.name', 'Anna Bianchi')
            );
    }

    public function test_the_search_box_opens_a_booking_by_its_number()
    {
        $booking = Booking::factory()->create();

        $this->actingAs($this->admin())
            ->get(route('admin.users', ['cerca' => "#{$booking->id}"]))
            ->assertRedirect(route('admin.bookings', ['cerca' => $booking->id]));

        $this->get(route('admin.bookings', ['cerca' => $booking->id]))
            ->assertInertia(fn (Assert $page) => $page
                ->has('bookings', 1)
                ->where('bookings.0.id', $booking->id)
            );
    }

    public function test_bookings_show_the_status_of_each_session()
    {
        $this->travelTo(CarbonImmutable::parse('2026-10-14 10:00', 'Europe/Rome'));
        $yesterday = CarbonImmutable::parse('2026-10-13 18:00', 'Europe/Rome');
        $tomorrow = CarbonImmutable::parse('2026-10-15 18:00', 'Europe/Rome');

        $pending = Booking::factory()->at($tomorrow)->create();
        $done = Booking::factory()->at($yesterday)->create(['status' => BookingStatus::Confirmed, 'confirmed_at' => now(), 'expires_at' => null]);
        $noShow = Booking::factory()->at($yesterday)->create(['status' => BookingStatus::Confirmed, 'confirmed_at' => now(), 'no_show_at' => now(), 'expires_at' => null]);
        $overdue = Booking::factory()->at($tomorrow)->create(['expires_at' => now()->subMinute()]);
        $declined = Booking::factory()->at($tomorrow)->create(['status' => BookingStatus::Declined]);
        $cancelled = Booking::factory()->at($tomorrow)->create(['status' => BookingStatus::Cancelled, 'cancelled_by' => BookingActor::Client, 'cancelled_at' => now()]);

        $this->actingAs($this->admin())
            ->get(route('admin.bookings'))
            ->assertInertia(function (Assert $page) use ($pending, $done, $noShow, $overdue, $declined, $cancelled) {
                $page->has('bookings', 6);
                $statuses = collect($page->toArray()['props']['bookings'])->pluck('status', 'id');

                $this->assertSame('pending', $statuses[$pending->id]);
                $this->assertSame('completed', $statuses[$done->id]);
                $this->assertSame('no_show', $statuses[$noShow->id]);
                $this->assertSame('expired', $statuses[$overdue->id]);
                $this->assertSame('declined', $statuses[$declined->id]);
                $this->assertSame('cancelled', $statuses[$cancelled->id]);
            });
    }

    public function test_reviews_flag_contacts_and_can_be_hidden_and_shown_again()
    {
        $admin = $this->admin();
        $review = Review::factory()->rating(1)->create(['text' => 'Pessimo, chiamatemi al 340 000 0000 che vi spiego.']);
        Review::factory()->rating(5)->create(['trainer_profile_id' => $review->trainer_profile_id]);
        $review->trainerProfile->refreshRating();

        $this->actingAs($admin)
            ->get(route('admin.reviews'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('reviews', 2)
                ->where('reviews', fn ($reviews) => collect($reviews)->firstWhere('id', $review->id)['warning'] === 'Contiene un numero di telefono')
            );

        $this->post(route('admin.reviews.hide', $review))->assertRedirect();

        $review->refresh();
        $this->assertNotNull($review->hidden_at);
        $this->assertSame($admin->id, $review->hidden_by);
        // Off the average: only the 5 stars are left.
        $this->assertSame(1, $review->trainerProfile->refresh()->rating_count);
        $this->assertSame(5.0, $review->trainerProfile->rating());

        $this->delete(route('admin.reviews.hide', $review))->assertRedirect();

        $this->assertNull($review->refresh()->hidden_at);
        $this->assertSame(2, $review->trainerProfile->refresh()->rating_count);
    }

    public function test_only_admins_can_hide_a_review()
    {
        $review = Review::factory()->create();

        $this->actingAs(User::factory()->create())
            ->post(route('admin.reviews.hide', $review))
            ->assertForbidden();

        $this->assertNull($review->refresh()->hidden_at);
    }

    public function test_overview_counts_the_real_users_and_bookings()
    {
        $this->travelTo(CarbonImmutable::parse('2026-10-14 10:00', 'Europe/Rome'));
        $admin = $this->admin();
        User::factory()->count(2)->create();
        // Made 10 days ago: last week.
        Booking::factory()->create(['created_at' => now()->subDays(10)]);
        Booking::factory()->count(2)->create(['status' => BookingStatus::Confirmed, 'confirmed_at' => now(), 'expires_at' => null]);
        Booking::factory()->create(['status' => BookingStatus::Expired]);
        Booking::factory()->create(['status' => BookingStatus::Declined]);

        $this->actingAs($admin)
            ->get(route('admin.overview'))
            ->assertInertia(fn (Assert $page) => $page
                // 2 clients, plus a client and a trainer for each of the 5 bookings: never the admin.
                ->where('stats.users', 12)
                ->where('stats.bookingsThisWeek', 4)
                ->where('stats.bookingsLastWeek', 1)
                ->where('stats.confirmedRate', 0.5)
                ->where('stats.expiredRate', 0.25)
                ->where('stats.declinedRate', 0.25)
            );
    }
}
