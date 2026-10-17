<?php

namespace Tests\Feature;

use App\Enums\TrainerProfileStatus;
use App\Models\Service;
use App\Models\TrainerProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** "Servizi e prezzi": an approved trainer changes the services, public right away. */
class TrainerServicesTest extends TestCase
{
    use RefreshDatabase;

    /**
     * What the page sends (toServicesPayload in draft.ts).
     *
     * @param  array<string, mixed>  $changes
     * @return array<string, mixed>
     */
    private function payload(array $changes = []): array
    {
        return [
            'sessions' => [
                [
                    'name' => 'Seduta singola',
                    'prices' => [['minutes' => 60, 'price_cents' => 5000], ['minutes' => 120, 'price_cents' => 9000]],
                    'note' => 'In studio, a domicilio o al parco',
                ],
                [
                    'name' => 'Calisthenics',
                    'prices' => [['minutes' => 90, 'price_cents' => 6000]],
                    'note' => '',
                ],
            ],
            'first_session' => ['minutes' => 30, 'price_cents' => 0, 'note' => ''],
            'packages' => [['sessions' => 10, 'minutes' => 60, 'price_cents' => 45000, 'note' => '']],
            ...$changes,
        ];
    }

    /** Online only (the factory default): no separate online prices. */
    private function approvedTrainer(): TrainerProfile
    {
        return TrainerProfile::factory()->approved()->bookable()->create();
    }

    public function test_the_page_shows_the_saved_services()
    {
        $profile = $this->approvedTrainer();

        $this->actingAs($profile->user)
            ->get(route('trainer.services'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('trainer/services')
                ->where('pricing.sessions.0.name', 'Seduta singola')
                ->where('pricing.sessions.0.prices', [['minutes' => 60, 'priceCents' => 4000], ['minutes' => 120, 'priceCents' => 7500]])
                ->where('pricing.firstSession.enabled', false)
                ->where('asksOnlinePrice', false)
            );
    }

    public function test_the_trainer_saves_the_services_without_a_new_review()
    {
        $profile = $this->approvedTrainer();

        $this->actingAs($profile->user)
            ->from(route('trainer.services'))
            ->put(route('trainer.services.update'), $this->payload())
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('trainer.services'));

        $profile->refresh();
        $this->assertSame(TrainerProfileStatus::Approved, $profile->status);
        $this->assertSame(
            [
                [Service::FIRST_SESSION_NAME, 30, 0],
                ['Seduta singola', 60, 5000],
                ['Seduta singola', 120, 9000],
                ['Calisthenics', 90, 6000],
                ['Pacchetto 10 sedute', 60, 45000],
            ],
            $profile->services->sortBy('sort')->map(fn (Service $service) => [$service->name, $service->minutes, $service->price_cents])->values()->all(),
        );
        // "da 50 €": the lowest price of a kind of session, not the free first session.
        $this->assertSame(5000, $profile->price_from_cents);
        // Every bookable duration, shortest first.
        $this->assertSame([30, 60, 90, 120], $profile->session_minutes);
    }

    public function test_the_online_prices_only_for_who_trains_online_and_in_person()
    {
        $profile = $this->approvedTrainer();
        $session = [
            'name' => 'Seduta singola',
            'prices' => [['minutes' => 60, 'price_cents' => 5000]],
            'online_prices' => [['minutes' => 60, 'price_cents' => 3500]],
            'online_note' => 'In videochiamata',
        ];

        // Online only: the same prices cover online.
        $this->actingAs($profile->user)
            ->put(route('trainer.services.update'), $this->payload(['sessions' => [$session]]))
            ->assertSessionHasNoErrors();
        $this->assertFalse($profile->services()->where('online_only', true)->exists());

        // Online and in person: online has its own prices.
        $profile->forceFill(['trains_in_person' => true])->save();
        // A fresh user: the one above still has the profile read by the first request.
        $this->actingAs($profile->user()->firstOrFail())
            ->put(route('trainer.services.update'), $this->payload(['sessions' => [$session]]))
            ->assertSessionHasNoErrors();

        $online = $profile->services()->where('online_only', true)->sole();
        $this->assertSame(3500, $online->price_cents);
        $this->assertSame('In videochiamata', $online->note);
        $this->assertSame(3500, $profile->fresh()?->price_from_cents);
    }

    public function test_the_same_checks_as_the_registration()
    {
        $profile = $this->approvedTrainer();

        $this->actingAs($profile->user)
            ->put(route('trainer.services.update'), $this->payload([
                'sessions' => [
                    ['name' => 'Prima seduta', 'prices' => [['minutes' => 60, 'price_cents' => 5000]]],
                    ['name' => 'Calisthenics', 'prices' => [['minutes' => 60, 'price_cents' => 50]]],
                ],
                'packages' => [['sessions' => 1, 'minutes' => 60, 'price_cents' => 45000]],
            ]))
            ->assertSessionHasErrors(['sessions.0.name', 'sessions.1.prices.0.price_cents', 'packages.0.sessions']);

        // Nothing changed: still the 2 rows of the factory.
        $this->assertSame(2, $profile->services()->count());
    }

    public function test_a_profile_not_approved_yet_is_changed_from_the_registration()
    {
        $profile = TrainerProfile::factory()->status(TrainerProfileStatus::Review)->bookable()->create();

        $this->actingAs($profile->user)
            ->get(route('trainer.services'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('pricing', null));

        $this->actingAs($profile->user)
            ->put(route('trainer.services.update'), $this->payload())
            ->assertForbidden();

        $this->assertSame(2, $profile->services()->count());
    }

    public function test_clients_cannot_open_the_page()
    {
        $client = User::factory()->create();

        $this->actingAs($client)
            ->get(route('trainer.services'))
            ->assertRedirect();
    }
}
