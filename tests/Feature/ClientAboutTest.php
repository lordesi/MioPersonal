<?php

namespace Tests\Feature;

use App\Enums\ActivityLevel;
use App\Enums\FitnessLevel;
use App\Enums\Sex;
use App\Enums\TrainingExperience;
use App\Models\Booking;
use App\Models\ClientPreference;
use App\Models\TrainerProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * "Su di te" of "Completa il tuo profilo" and "Sul cliente" in the trainer area.
 */
class ClientAboutTest extends TestCase
{
    use RefreshDatabase;

    /** @return array<string, mixed> */
    private function about(array $overrides = []): array
    {
        return [
            'birth_year' => now()->year - 30,
            'sex' => 'female',
            'fitness_level' => 'beginner',
            'training_experience' => 'under_1',
            'activity_level' => 'sedentary',
            'sessions_per_week' => 2,
            'sports' => ['  Nuoto ', 'Calcio a 5', ''],
            'trainer_note' => "Lavoro in ufficio.\n",
            'body_data_consent' => true,
            'height_cm' => 168,
            'weight_kg' => 62,
            ...$overrides,
        ];
    }

    public function test_the_client_saves_su_di_te()
    {
        $client = User::factory()->create();

        $this->actingAs($client)
            ->put(route('client.profile.update'), $this->about())
            ->assertSessionHasNoErrors();

        $preference = ClientPreference::findOrFail($client->id);
        $this->assertSame(now()->year - 30, $preference->birth_year);
        $this->assertSame(Sex::Female, $preference->sex);
        $this->assertSame(FitnessLevel::Beginner, $preference->fitness_level);
        $this->assertSame(TrainingExperience::UnderOneYear, $preference->training_experience);
        $this->assertSame(ActivityLevel::Sedentary, $preference->activity_level);
        $this->assertSame(2, $preference->sessions_per_week);
        // Trimmed, without the empty ones.
        $this->assertSame(['Nuoto', 'Calcio a 5'], $preference->sports);
        $this->assertSame('Lavoro in ufficio.', $preference->trainer_note);
        $this->assertSame(168, $preference->height_cm);
        $this->assertSame(62, $preference->weight_kg);
        $this->assertNotNull($preference->body_data_consent_at);

        $this->actingAs($client)
            ->get(route('client.profile'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('preferences.sex', 'female')
                ->where('preferences.sports', ['Nuoto', 'Calcio a 5'])
                ->where('preferences.bodyDataConsent', true)
                ->where('preferences.heightCm', 168)
                ->where('birthYears.from', now()->year - 18)
            );
    }

    public function test_height_and_weight_need_the_consent()
    {
        $client = User::factory()->create();

        $this->actingAs($client)
            ->put(route('client.profile.update'), $this->about(['body_data_consent' => false]))
            ->assertSessionHasErrors(['height_cm', 'weight_kg']);

        $this->assertNull(ClientPreference::find($client->id));
    }

    public function test_withdrawing_the_consent_deletes_height_and_weight()
    {
        $client = User::factory()->create();
        $this->actingAs($client)->put(route('client.profile.update'), $this->about());

        $this->actingAs($client)
            ->put(route('client.profile.update'), $this->about(['body_data_consent' => false, 'height_cm' => null, 'weight_kg' => null]))
            ->assertSessionHasNoErrors();

        $preference = ClientPreference::findOrFail($client->id);
        $this->assertNull($preference->height_cm);
        $this->assertNull($preference->weight_kg);
        $this->assertNull($preference->body_data_consent_at);
    }

    public function test_only_adults_and_values_of_the_page_are_accepted()
    {
        $client = User::factory()->create();

        $this->actingAs($client)
            ->put(route('client.profile.update'), $this->about([
                'birth_year' => now()->year - 17,
                'sex' => 'unknown',
                'sessions_per_week' => 8,
                'sports' => array_fill(0, 9, 'Sport'),
                'height_cm' => 300,
                'trainer_note' => str_repeat('a', 501),
            ]))
            ->assertSessionHasErrors(['birth_year', 'sex', 'sessions_per_week', 'sports', 'height_cm', 'trainer_note']);
    }

    public function test_the_trainer_reads_it_in_the_requests_and_in_the_clients()
    {
        $trainer = TrainerProfile::factory()->approved()->create();
        $request = Booking::factory()->for($trainer)->create(['expires_at' => now()->addHours(5)]);
        $confirmed = Booking::factory()->for($trainer)->confirmed()->create(['starts_at' => now()->addDay(), 'ends_at' => now()->addDay()->addHour()]);

        foreach ([$request->client, $confirmed->client] as $client) {
            $this->actingAs($client)->put(route('client.profile.update'), $this->about());
        }

        $this->actingAs($trainer->user)
            ->get(route('trainer.requests'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('requests.0.about.age', 30)
                ->where('requests.0.about.sex', 'Donna')
                ->where('requests.0.about.level', 'Principiante')
                ->where('requests.0.about.sports', ['Nuoto', 'Calcio a 5'])
                ->where('requests.0.about.heightCm', 168)
            );

        $this->actingAs($trainer->user)
            ->get(route('trainer.clients'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('clients.0.about.experience', 'Meno di 1 anno')
                ->where('clients.0.about.note', 'Lavoro in ufficio.')
            );
    }

    public function test_a_client_who_wrote_nothing_has_no_about()
    {
        $trainer = TrainerProfile::factory()->approved()->create();
        Booking::factory()->for($trainer)->create(['expires_at' => now()->addHours(5)]);

        $this->actingAs($trainer->user)
            ->get(route('trainer.requests'))
            ->assertInertia(fn (Assert $page) => $page->where('requests.0.about', null));
    }
}
