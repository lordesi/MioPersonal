<?php

namespace Tests\Feature;

use App\Models\BodyMeasurement;
use App\Models\User;
use Carbon\CarbonImmutable;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** The weight over time: health data, only with the consent (GDPR art. 9). */
class BodyMeasurementsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo(CarbonImmutable::parse('2026-11-12 10:00', 'Europe/Rome'));
    }

    private function consenting(): User
    {
        $client = User::factory()->create();
        $client->clientPreference()->create(['body_data_consent_at' => now()]);

        return $client;
    }

    public function test_without_the_consent_there_is_no_weight()
    {
        $client = User::factory()->create();

        $this->actingAs($client)
            ->post(route('client.weight.store'), ['weight' => '72', 'measured_on' => '2026-11-12'])
            ->assertSessionHasErrors('weight');
        $this->assertSame(0, BodyMeasurement::count());

        $this->get(route('client.home'))->assertInertia(fn (Assert $page) => $page->where('weights', null));
    }

    public function test_one_weight_a_day_and_the_last_one_goes_to_su_di_te()
    {
        $client = $this->consenting();

        $this->actingAs($client)->post(route('client.weight.store'), ['weight' => '74.4', 'measured_on' => '2026-11-01'])->assertSessionHasNoErrors();
        $this->post(route('client.weight.store'), ['weight' => '73', 'measured_on' => '2026-11-12'])->assertSessionHasNoErrors();
        $this->post(route('client.weight.store'), ['weight' => '72.6', 'measured_on' => '2026-11-12'])->assertSessionHasNoErrors();
        $this->post(route('client.weight.store'), ['weight' => '20', 'measured_on' => '2026-11-12'])->assertSessionHasErrors('weight');

        $this->assertSame(2, BodyMeasurement::count());
        $this->assertSame(73, $client->clientPreference()->value('weight_kg'));

        $this->get(route('client.home'))->assertInertia(fn (Assert $page) => $page
            ->has('weights', 2)
            ->where('weights.0.date', '2026-11-01')
            ->where('weights.0.kg', 74.4)
            ->where('weights.1.kg', 72.6)
        );
    }

    public function test_a_client_deletes_only_their_own_weights()
    {
        $client = $this->consenting();
        $mine = $client->bodyMeasurements()->create(['measured_on' => '2026-11-10', 'weight_grams' => 70000]);
        $other = $this->consenting()->bodyMeasurements()->create(['measured_on' => '2026-11-10', 'weight_grams' => 80000]);

        $this->actingAs($client)->delete(route('client.weight.destroy', $other))->assertNotFound();
        $this->actingAs($client)->delete(route('client.weight.destroy', $mine))->assertRedirect();

        $this->assertModelMissing($mine);
        $this->assertModelExists($other);
    }

    public function test_withdrawing_the_consent_deletes_the_weights()
    {
        $this->seed(CatalogSeeder::class);
        $client = $this->consenting();
        $client->bodyMeasurements()->create(['measured_on' => '2026-11-10', 'weight_grams' => 70000]);

        $this->actingAs($client)
            ->put(route('client.profile.update'), ['body_data_consent' => false])
            ->assertSessionHasNoErrors();

        $this->assertSame(0, BodyMeasurement::count());
        $this->assertNull($client->clientPreference()->value('body_data_consent_at'));
    }

    public function test_a_weight_written_in_the_profile_joins_the_trend()
    {
        $this->seed(CatalogSeeder::class);
        $client = $this->consenting();

        $this->actingAs($client)
            ->put(route('client.profile.update'), ['body_data_consent' => true, 'weight_kg' => 71])
            ->assertSessionHasNoErrors();

        $measurement = BodyMeasurement::sole();
        $this->assertSame(71000, $measurement->weight_grams);
        $this->assertSame('2026-11-12', $measurement->measured_on);
    }
}
