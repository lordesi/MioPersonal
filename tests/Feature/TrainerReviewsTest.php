<?php

namespace Tests\Feature;

use App\Models\Review;
use App\Models\TrainerProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** "Recensioni" of the trainer: the clients' reviews and the public reply. */
class TrainerReviewsTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_trainer_sees_the_reviews_newest_first_without_the_hidden_ones()
    {
        $trainer = TrainerProfile::factory()->approved()->create();
        $old = Review::factory()->for($trainer)->rating(4)->create(['created_at' => now()->subWeek()]);
        $new = Review::factory()->for($trainer)->create();
        Review::factory()->for($trainer)->hidden()->create();
        // Another trainer's review.
        Review::factory()->create();
        $trainer->refreshRating();

        $this->actingAs($trainer->user)
            ->get(route('trainer.reviews'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('summary', ['average' => 4.5, 'count' => 2])
                ->has('reviews', 2)
                ->where('reviews.0.id', $new->id)
                ->where('reviews.0.authorName', $new->client->name)
                ->where('reviews.0.serviceName', null)
                ->where('reviews.1.id', $old->id)
                ->where('reviews.1.rating', 4)
            );
    }

    public function test_the_trainer_replies_once()
    {
        $trainer = TrainerProfile::factory()->approved()->create();
        $review = Review::factory()->for($trainer)->create();

        $this->actingAs($trainer->user)
            ->post(route('trainer.reviews.reply', $review), ['reply' => '  Grazie mille!  '])
            ->assertSessionHasNoErrors();

        $review->refresh();
        $this->assertSame('Grazie mille!', $review->reply);
        $this->assertNotNull($review->replied_at);

        $this->actingAs($trainer->user)
            ->post(route('trainer.reviews.reply', $review), ['reply' => 'Di nuovo'])
            ->assertSessionHasErrors('reply');

        $this->assertSame('Grazie mille!', $review->refresh()->reply);
    }

    public function test_the_reply_is_required()
    {
        $trainer = TrainerProfile::factory()->approved()->create();
        $review = Review::factory()->for($trainer)->create();

        $this->actingAs($trainer->user)
            ->post(route('trainer.reviews.reply', $review), ['reply' => ''])
            ->assertSessionHasErrors('reply');
    }

    public function test_nobody_replies_to_another_trainers_review_or_a_hidden_one()
    {
        $trainer = TrainerProfile::factory()->approved()->create();

        $this->actingAs($trainer->user)
            ->post(route('trainer.reviews.reply', Review::factory()->create()), ['reply' => 'Grazie'])
            ->assertNotFound();

        $this->actingAs($trainer->user)
            ->post(route('trainer.reviews.reply', Review::factory()->for($trainer)->hidden()->create()), ['reply' => 'Grazie'])
            ->assertNotFound();
    }
}
