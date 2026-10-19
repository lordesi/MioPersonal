<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Review;
use App\Models\TrainerProfile;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** "Lascia una recensione" under a session done, in "Le mie prenotazioni". */
class ClientReviewTest extends TestCase
{
    use RefreshDatabase;

    private User $client;

    private TrainerProfile $trainer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->client = User::factory()->create();
        $this->trainer = TrainerProfile::factory()->approved()->create();
    }

    private function doneSession(): Booking
    {
        return Booking::factory()->for($this->client, 'client')->for($this->trainer)->confirmed()
            ->at(CarbonImmutable::now()->subDays(2))
            ->create();
    }

    public function test_the_client_reviews_a_session_done()
    {
        $booking = $this->doneSession();

        $this->actingAs($this->client)
            ->post(route('client.bookings.review', $booking), ['rating' => 4, 'text' => '  Allenamento ottimo, molto attento.  '])
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $review = Review::sole();
        $this->assertSame($booking->id, $review->booking_id);
        $this->assertSame($this->client->id, $review->client_id);
        $this->assertSame($this->trainer->id, $review->trainer_profile_id);
        $this->assertSame(4, $review->rating);
        $this->assertSame('Allenamento ottimo, molto attento.', $review->text);
        $this->assertNull($review->flag_reason);

        // The average of the profile counts it right away.
        $this->trainer->refresh();
        $this->assertSame(1, $this->trainer->rating_count);
        $this->assertSame(4.0, $this->trainer->rating());
    }

    public function test_one_review_per_session()
    {
        $booking = $this->doneSession();
        $this->actingAs($this->client)->post(route('client.bookings.review', $booking), ['rating' => 5, 'text' => 'Bravissimo.']);

        $this->actingAs($this->client)
            ->post(route('client.bookings.review', $booking), ['rating' => 1, 'text' => 'Ci ho ripensato.'])
            ->assertSessionHasErrors('review');

        $this->assertSame(5, Review::sole()->rating);
    }

    public function test_only_after_a_session_done()
    {
        $future = Booking::factory()->for($this->client, 'client')->for($this->trainer)->confirmed()->at(CarbonImmutable::now()->addDay())->create();
        $missed = Booking::factory()->for($this->client, 'client')->for($this->trainer)->confirmed()->at(CarbonImmutable::now()->subDay())->create(['no_show_at' => now()]);
        $notConfirmed = Booking::factory()->for($this->client, 'client')->for($this->trainer)->at(CarbonImmutable::now()->subDay())->create();

        foreach ([$future, $missed, $notConfirmed] as $booking) {
            $this->actingAs($this->client)
                ->post(route('client.bookings.review', $booking), ['rating' => 5, 'text' => 'Ottimo.'])
                ->assertSessionHasErrors('review');
        }

        $this->assertSame(0, Review::count());
    }

    public function test_nobody_else_reviews_the_session()
    {
        $booking = $this->doneSession();

        $this->actingAs(User::factory()->create())
            ->post(route('client.bookings.review', $booking), ['rating' => 5, 'text' => 'Ottimo.'])
            ->assertNotFound();
    }

    public function test_the_rating_goes_from_1_to_5_and_the_text_is_required()
    {
        $booking = $this->doneSession();

        $this->actingAs($this->client)
            ->post(route('client.bookings.review', $booking), ['rating' => 6, 'text' => ''])
            ->assertSessionHasErrors(['rating', 'text']);

        $this->actingAs($this->client)
            ->post(route('client.bookings.review', $booking), ['rating' => 0, 'text' => str_repeat('a', 1001)])
            ->assertSessionHasErrors(['rating', 'text']);

        $this->assertSame(0, Review::count());
    }

    public function test_contacts_in_the_text_are_flagged_for_the_team()
    {
        $booking = $this->doneSession();

        $this->actingAs($this->client)
            ->post(route('client.bookings.review', $booking), ['rating' => 5, 'text' => 'Scrivetemi al 333 123 4567 per info.'])
            ->assertSessionHasNoErrors();

        $this->assertSame('Contiene un numero di telefono', Review::sole()->flag_reason);
    }

    public function test_an_unverified_email_cannot_review()
    {
        $client = User::factory()->unverified()->create();
        $booking = Booking::factory()->for($client, 'client')->for($this->trainer)->confirmed()->at(CarbonImmutable::now()->subDays(2))->create();

        $this->actingAs($client)
            ->post(route('client.bookings.review', $booking), ['rating' => 5, 'text' => 'Ottimo.'])
            ->assertRedirect(route('verification.notice'));

        $this->assertSame(0, Review::count());
    }
}
