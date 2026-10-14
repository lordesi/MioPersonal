<?php

namespace Tests\Feature;

use App\Enums\PreferredTime;
use App\Enums\TrainingGoal;
use App\Enums\TrainingMode;
use App\Enums\UserRole;
use App\Models\City;
use App\Models\ClientPreference;
use App\Models\Discipline;
use App\Models\TrainerProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class OnboardingTest extends TestCase
{
    use RefreshDatabase;

    public function test_trainer_registration_page_renders()
    {
        $this->get(route('trainer.register'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('onboarding/trainer-registration')
                ->where('submitted', false)
            );
    }

    public function test_a_client_sees_their_account_in_the_trainer_registration()
    {
        $client = User::factory()->create(['name' => 'Luca Moretti']);

        $this->actingAs($client)
            ->get(route('trainer.register'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('account.name', 'Luca Moretti')
                ->where('account.email', $client->email)
            );
    }

    public function test_a_client_has_to_accept_the_trainer_terms()
    {
        $client = User::factory()->create();

        $this->actingAs($client)
            ->post(route('trainer.register.store'), [])
            ->assertSessionHasErrors('terms');

        $this->assertSame(UserRole::Client, $client->refresh()->role);
    }

    /** Saving the whole registration is tested in TrainerRegistrationTest. */
    public function test_trainers_and_admins_are_sent_to_their_area()
    {
        // A profile waiting for the team can't be sent again.
        $trainer = TrainerProfile::factory()->create()->user;
        $admin = User::factory()->admin()->create();

        $this->actingAs($trainer)->get(route('trainer.register'))->assertRedirect(route('trainer.today'));
        $this->actingAs($trainer)->post(route('trainer.register.store'), ['terms' => '1'])
            ->assertRedirect(route('trainer.today'));
        $this->actingAs($admin)->get(route('trainer.register'))->assertRedirect(route('admin.overview'));

        $this->assertSame(UserRole::Admin, $admin->refresh()->role);
    }

    public function test_trainer_registration_validates_the_account()
    {
        $this->post(route('trainer.register.store'), [
            'first_name' => '',
            'email' => 'not-an-email',
        ])->assertSessionHasErrors(['first_name', 'last_name', 'email', 'password', 'terms']);

        $this->assertGuest();
    }

    public function test_complete_profile_page_needs_login()
    {
        $this->get(route('client.complete-profile'))->assertRedirect(route('login'));

        $this->actingAs(User::factory()->create())
            ->get(route('client.complete-profile'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('onboarding/complete-profile'));
    }

    public function test_complete_profile_saves_the_preferences()
    {
        $client = User::factory()->create();
        $city = City::factory()->create(['slug' => 'milano']);
        $yoga = Discipline::factory()->create(['slug' => 'yoga']);
        $pilates = Discipline::factory()->create(['slug' => 'pilates']);

        $this->actingAs($client)
            ->put(route('client.complete-profile.update'), [
                'city' => 'milano',
                'mode' => 'both',
                'goal' => 'posture',
                'disciplines' => ['pilates', 'yoga'],
                'times' => ['evening', 'weekend'],
                'budget_max_cents' => 4500,
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('client.home'));

        $preference = $client->clientPreference()->firstOrFail();
        $this->assertSame($city->id, $preference->city_id);
        $this->assertSame(TrainingMode::Both, $preference->mode);
        $this->assertSame(TrainingGoal::Posture, $preference->goal);
        // In the client's order.
        $this->assertSame([$pilates->id, $yoga->id], $preference->discipline_ids);
        $this->assertSame([PreferredTime::Evening, PreferredTime::Weekend], $preference->times?->all());
        $this->assertSame(4500, $preference->budget_max_cents);

        // Opened again from Account, the page shows the saved answers.
        $this->get(route('client.complete-profile'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('preferences.city', 'milano')
                ->where('preferences.disciplines', ['pilates', 'yoga'])
                ->where('preferences.times', ['evening', 'weekend'])
                ->where('preferences.budgetMaxCents', 4500)
            );
    }

    public function test_complete_profile_can_be_saved_empty_and_changed_later()
    {
        $client = User::factory()->create();

        $this->actingAs($client)->put(route('client.complete-profile.update'), [])->assertSessionHasNoErrors();
        $this->put(route('client.complete-profile.update'), ['goal' => 'fitness'])->assertSessionHasNoErrors();

        $this->assertSame(1, ClientPreference::count());
        $this->assertSame(TrainingGoal::Fitness, $client->clientPreference()->firstOrFail()->goal);
    }

    public function test_complete_profile_rejects_unknown_values()
    {
        City::factory()->create(['slug' => 'nascosta', 'is_active' => false]);

        $this->actingAs(User::factory()->create())
            ->put(route('client.complete-profile.update'), [
                'city' => 'nascosta',
                'mode' => 'teletrasporto',
                'goal' => 'guarire',
                'disciplines' => ['non-esiste'],
                'times' => ['mezzanotte'],
                'budget_max_cents' => 4550,
            ])
            ->assertSessionHasErrors(['city', 'mode', 'goal', 'disciplines.0', 'times.0', 'budget_max_cents']);

        $this->assertSame(0, ClientPreference::count());
    }

    public function test_the_photo_is_saved_and_replaces_the_old_one()
    {
        Storage::fake(User::AVATAR_DISK);
        $client = User::factory()->create();

        $this->actingAs($client)
            ->from(route('client.complete-profile'))
            ->post(route('client.complete-profile.photo'), ['photo' => UploadedFile::fake()->image('io.jpg', 400, 400)])
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('client.complete-profile'));

        $first = $client->refresh()->avatar_path;
        $this->assertNotNull($first);
        Storage::disk(User::AVATAR_DISK)->assertExists($first);
        $this->assertSame(Storage::disk(User::AVATAR_DISK)->url($first), $client->avatar);

        $this->post(route('client.complete-profile.photo'), ['photo' => UploadedFile::fake()->image('nuova.png', 400, 400)])
            ->assertSessionHasNoErrors();

        Storage::disk(User::AVATAR_DISK)->assertMissing($first);
        Storage::disk(User::AVATAR_DISK)->assertExists((string) $client->refresh()->avatar_path);
    }

    public function test_the_photo_must_be_an_image()
    {
        Storage::fake(User::AVATAR_DISK);

        $this->actingAs(User::factory()->create())
            ->post(route('client.complete-profile.photo'), ['photo' => UploadedFile::fake()->create('cv.pdf', 100, 'application/pdf')])
            ->assertSessionHasErrors('photo');
    }

    public function test_trainers_can_not_use_complete_profile()
    {
        $trainer = User::factory()->trainer()->create();

        $this->actingAs($trainer)->put(route('client.complete-profile.update'), [])->assertRedirect();
        $this->assertSame(0, ClientPreference::count());
    }

    public function test_dashboard_sends_clients_to_their_home()
    {
        $this->actingAs(User::factory()->create())
            ->get(route('dashboard'))
            ->assertRedirect(route('client.home'));
    }
}
