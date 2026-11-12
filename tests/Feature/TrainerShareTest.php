<?php

namespace Tests\Feature;

use App\Enums\TrainerProfileStatus;
use App\Models\TrainerProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * "Condividi profilo" (link, QR code, image for the stories) and "Invita i
 * tuoi clienti": the links carry their utm_*, so the sign-ups they bring are
 * counted.
 */
class TrainerShareTest extends TestCase
{
    use RefreshDatabase;

    public function test_an_approved_trainer_gets_the_links_to_share(): void
    {
        $profile = TrainerProfile::factory()->approved()->create(['slug' => 'giulia-rossi']);

        $this->actingAs($profile->user)
            ->get(route('trainer.share'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('trainer/share')
                ->where('reason', null)
                ->where('card.name', $profile->user->name)
                ->where('card.links.bio', route('trainers.show', [
                    'slug' => 'giulia-rossi',
                    'utm_source' => 'instagram',
                    'utm_medium' => 'bio',
                    'utm_campaign' => 'giulia-rossi',
                ])));
    }

    public function test_a_profile_not_in_the_search_cannot_be_shared_yet(): void
    {
        $review = TrainerProfile::factory()->status(TrainerProfileStatus::Review)->create();
        $hidden = TrainerProfile::factory()->approved()->create(['visible_in_search' => false]);

        $this->actingAs($review->user)->get(route('trainer.share'))
            ->assertInertia(fn (Assert $page) => $page->where('card', null)->where('reason', 'review'));
        $this->actingAs($hidden->user)->get(route('trainer.share'))
            ->assertInertia(fn (Assert $page) => $page->where('card', null)->where('reason', 'hidden'));
    }

    public function test_the_invite_link_shows_the_banner_and_counts_the_sign_ups(): void
    {
        $profile = TrainerProfile::factory()->approved()->bookable()->create(['slug' => 'giulia-rossi']);

        $this->actingAs($profile->user)
            ->get(route('trainer.clients'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('invite.link', route('trainers.show', [
                    'slug' => 'giulia-rossi',
                    'invito' => 1,
                    'utm_source' => 'trainer',
                    'utm_medium' => 'invito',
                    'utm_campaign' => 'giulia-rossi',
                ]))
                ->where('invite.signups', 0));

        // A client opens the link…
        auth()->logout();
        // A new visitor: the channel is read on the first page of the visit.
        $this->flushSession();
        $this->get('/trainer/giulia-rossi?invito=1&utm_source=trainer&utm_medium=invito&utm_campaign=giulia-rossi')
            ->assertInertia(fn (Assert $page) => $page->where('invited', true));

        // …and signs up: the sign-up goes to the trainer.
        $this->post(route('register.store'), [
            'first_name' => 'Anna',
            'last_name' => 'Bianchi',
            'username' => 'anna-bianchi',
            'email' => 'anna@example.com',
            'phone' => '347 521 8846',
            'password' => 'Una-password-sicura-1',
            'password_confirmation' => 'Una-password-sicura-1',
            'terms' => '1',
        ]);
        $this->assertSame('trainer', User::where('email', 'anna@example.com')->value('acquisition')['source'] ?? null);

        $this->actingAs($profile->user)
            ->get(route('trainer.clients'))
            ->assertInertia(fn (Assert $page) => $page->where('invite.signups', 1));
    }
}
