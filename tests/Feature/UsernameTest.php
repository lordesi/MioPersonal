<?php

namespace Tests\Feature;

use App\Actions\Account\DeleteUser;
use App\Models\GymProfile;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Rules\Username;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class UsernameTest extends TestCase
{
    use RefreshDatabase;

    /** @return array<string, mixed> */
    private function signUp(array $changes = []): array
    {
        return [
            'first_name' => 'Luca',
            'last_name' => 'Moretti',
            'username' => 'luca-fit',
            'email' => 'luca@example.com',
            'phone' => '347 521 8846',
            'password' => 'Password1',
            'terms' => '1',
            ...$changes,
        ];
    }

    public function test_the_username_is_chosen_at_sign_up_and_locked()
    {
        $this->post(route('register.store'), $this->signUp(['username' => ' @Luca-Fit ']))->assertSessionHasNoErrors();

        $user = User::firstOrFail();
        $this->assertSame('luca-fit', $user->username);
        $this->assertTrue($user->hasChosenUsername());
    }

    public function test_the_username_is_required_and_unique()
    {
        User::factory()->create(['username' => 'luca-fit']);

        $this->post(route('register.store'), $this->signUp(['username' => '']))->assertSessionHasErrors('username');
        // Uppercase is the same username.
        $this->post(route('register.store'), $this->signUp(['username' => 'LUCA-FIT']))
            ->assertSessionHasErrors(['username' => 'Questo username è già preso.']);

        $this->assertGuest();
    }

    public function test_bad_and_reserved_usernames_are_refused()
    {
        foreach (['ab', 'luca.fit', '-luca', 'luca--fit', 'luca_', str_repeat('a', 31), 'admin', 'miopersonal'] as $username) {
            $this->post(route('register.store'), $this->signUp(['username' => $username]))
                ->assertSessionHasErrors('username');
        }

        $this->assertDatabaseCount('users', 0);
    }

    public function test_the_live_check_says_if_it_is_free()
    {
        User::factory()->create(['username' => 'giulia-rossi']);

        $this->postJson(route('username.check'), ['value' => '@Giulia-Rossi'])
            ->assertOk()
            ->assertJson(['username' => 'giulia-rossi', 'error' => 'Questo username è già preso.']);

        $this->postJson(route('username.check'), ['value' => 'giulia-fit'])
            ->assertJson(['username' => 'giulia-fit', 'error' => null]);
    }

    public function test_the_own_username_counts_as_free_in_the_live_check()
    {
        $user = User::factory()->create(['username' => 'giulia-rossi']);

        $this->actingAs($user)->postJson(route('username.check'), ['value' => 'giulia-rossi'])
            ->assertJson(['error' => null]);
    }

    public function test_the_trainer_page_is_at_the_username()
    {
        $profile = TrainerProfile::factory()->approved()->create();
        $profile->forceFill(['slug' => $profile->user->username])->save();

        $this->get('/trainer/'.$profile->user->username)->assertOk();
    }

    public function test_accounts_from_before_confirm_their_username_once()
    {
        $user = User::factory()->withoutChosenUsername()->create(['username' => 'luca-moretti']);

        $this->actingAs($user)->get(route('client.home'))->assertRedirect(route('username.show'));

        $this->get(route('username.show'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('auth/choose-username')
                ->where('username', 'luca-moretti')
                ->where('linkPrefix', null));

        $this->post(route('username.store'), ['username' => 'luca-fit'])
            ->assertRedirect(route('client.home'));

        $user->refresh();
        $this->assertSame('luca-fit', $user->username);
        $this->assertTrue($user->hasChosenUsername());

        // Locked: no more redirects, and a second confirmation changes nothing.
        $this->get(route('client.home'))->assertOk();
        $this->post(route('username.store'), ['username' => 'altro-nome']);
        $this->assertSame('luca-fit', $user->refresh()->username);
    }

    public function test_forms_are_not_redirected_before_the_confirmation()
    {
        $user = User::factory()->withoutChosenUsername()->create();

        $this->actingAs($user)->post(route('logout'))->assertRedirect();
        $this->assertGuest();
    }

    public function test_a_new_link_keeps_the_old_one_working()
    {
        $profile = TrainerProfile::factory()->approved()->create(['slug' => 'giulia-rossi-2']);
        $profile->user->forceFill(['username' => 'giulia-rossi-2', 'username_chosen_at' => null])->save();

        $this->actingAs($profile->user)->post(route('username.store'), ['username' => 'giuliafit'])->assertRedirect();

        $profile->refresh();
        $this->assertSame('giuliafit', $profile->slug);
        $this->assertSame('giulia-rossi-2', $profile->legacy_slug);

        $this->get('/trainer/giulia-rossi-2?c=abc')
            ->assertStatus(301)
            ->assertRedirect(route('trainers.show', ['slug' => 'giuliafit', 'c' => 'abc']));
        $this->get('/trainer/giuliafit')->assertOk();
    }

    public function test_an_old_gym_link_goes_to_the_current_one()
    {
        $gym = GymProfile::factory()->approved()->create(['slug' => 'fitlab', 'legacy_slug' => 'fitlab-milano']);

        $this->get('/palestra/fitlab-milano')->assertStatus(301)->assertRedirect(route('gyms.show', $gym->slug));
        $this->get('/palestra/nessuna')->assertNotFound();
    }

    public function test_the_settings_can_not_change_the_username()
    {
        $user = User::factory()->create(['username' => 'luca-fit']);

        $this->actingAs($user)->patch(route('account.personal.update'), [
            'first_name' => 'Luca',
            'last_name' => 'Moretti',
            'phone' => '347 521 8846',
            'username' => 'altro-nome',
        ]);

        $this->assertSame('luca-fit', $user->refresh()->username);
    }

    public function test_a_deleted_account_frees_its_username()
    {
        $user = User::factory()->create(['username' => 'luca-fit']);

        app(DeleteUser::class)->handle($user);

        $this->post(route('register.store'), $this->signUp())->assertSessionHasNoErrors();
        $this->assertSame('luca-fit', User::firstOrFail()->username);
    }

    public function test_accounts_made_without_the_form_get_a_free_username()
    {
        User::factory()->create(['username' => 'giulia-rossi']);

        $user = User::factory()->create(['first_name' => 'Giulia', 'last_name' => 'Rossì']);

        $this->assertSame('giulia-rossi-2', $user->username);
        $this->assertSame('mario-rossi', Username::suggest('Mario', 'Rossi'));
    }
}
