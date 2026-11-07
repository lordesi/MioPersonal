<?php

namespace Tests\Feature;

use App\Models\GymProfile;
use App\Models\TrainerPhoto;
use App\Models\TrainerProfile;
use App\Models\TrainerSocialAccount;
use App\Models\User;
use App\Support\TrainerSocials;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialUser;
use Tests\TestCase;

/** "Collega Instagram / TikTok / Facebook / YouTube": TrainerSocialController. */
class TrainerSocialAccountsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(CatalogSeeder::class);
        Storage::fake('public');
        Storage::fake('local');

        foreach (['instagram', 'tiktok', 'facebook', 'youtube'] as $provider) {
            config(["services.{$provider}.client_id" => "{$provider}-id", "services.{$provider}.client_secret" => 'secret']);
        }
    }

    private function fakeSocial(string $provider, string $id, ?string $nickname, ?string $name = null, array $raw = []): void
    {
        Socialite::fake($provider, (new SocialUser)->setRaw($raw)->map([
            'id' => $id,
            'nickname' => $nickname,
            'name' => $name ?? $nickname,
        ]));
    }

    private function approvedTrainer(): TrainerProfile
    {
        $profile = TrainerProfile::factory()->approved()->bookable()->withDisciplines(['yoga'])->create();
        $path = UploadedFile::fake()->image('ritratto.jpg', 600, 600)->store("trainers/{$profile->id}", TrainerPhoto::DISK);
        $profile->photos()->create(['path' => $path, 'caption' => 'Ritratto', 'is_portrait' => true]);

        return $profile;
    }

    public function test_a_trainer_links_instagram_and_the_public_profile_shows_the_icon()
    {
        $profile = $this->approvedTrainer();
        $this->fakeSocial('instagram', 'ig-1', 'giulia.fit');

        $this->actingAs($profile->user)
            ->get(route('social.callback', 'instagram'))
            ->assertRedirect(route('trainer.profile.edit'));

        $account = $profile->socialAccounts()->sole();
        $this->assertSame('giulia.fit', $account->handle);
        $this->assertSame('https://www.instagram.com/giulia.fit/', $account->url);

        $this->get(route('trainers.show', $profile->slug))
            ->assertInertia(fn (Assert $page) => $page
                ->where('trainer.socials', [['provider' => 'instagram', 'handle' => 'giulia.fit', 'url' => 'https://www.instagram.com/giulia.fit/']]))
            ->assertSee('"sameAs":["https:\/\/www.instagram.com\/giulia.fit\/"]', false);
    }

    public function test_the_popup_answers_the_page_that_opened_it()
    {
        $profile = $this->approvedTrainer();
        $this->fakeSocial('tiktok', 'tt-1', 'giuliafit');

        $this->actingAs($profile->user)
            ->withSession(['trainer_social_popup' => true])
            ->get(route('social.callback', 'tiktok'))
            ->assertOk()
            ->assertViewIs('social.popup-done')
            ->assertSee('trainer-social', false)
            ->assertSee('TikTok collegato: @giuliafit.');

        $this->assertSame('https://www.tiktok.com/@giuliafit', $profile->socialAccounts()->sole()->url);
    }

    public function test_the_icons_follow_the_order_of_the_socials()
    {
        $profile = $this->approvedTrainer();

        foreach ([['youtube', 'yt-1', 'giuliayt'], ['tiktok', 'tt-1', 'giuliatt'], ['instagram', 'ig-1', 'giulia.fit']] as [$provider, $id, $handle]) {
            $this->fakeSocial($provider, $id, $handle);
            $this->actingAs($profile->user)->get(route('social.callback', $provider));
        }

        $this->get(route('trainers.show', $profile->slug))
            ->assertInertia(fn (Assert $page) => $page
                ->where('trainer.socials.0.provider', 'instagram')
                ->where('trainer.socials.1.provider', 'tiktok')
                ->where('trainer.socials.2.provider', 'youtube')
                ->where('trainer.socials.2.url', 'https://www.youtube.com/@giuliayt'));
    }

    public function test_facebook_keeps_the_name_and_the_link_it_gives()
    {
        $profile = $this->approvedTrainer();
        $this->fakeSocial('facebook', 'fb-1', null, 'Giulia Rossi', ['link' => 'https://www.facebook.com/giulia.rossi']);

        $this->actingAs($profile->user)->get(route('social.callback', 'facebook'));

        $account = $profile->socialAccounts()->sole();
        $this->assertSame('Giulia Rossi', $account->handle);
        $this->assertSame('https://www.facebook.com/giulia.rossi', $account->url);
    }

    public function test_an_account_without_a_username_is_not_linked()
    {
        $profile = $this->approvedTrainer();
        // A Google account without a YouTube channel.
        $this->fakeSocial('youtube', '', '');

        $this->actingAs($profile->user)
            ->get(route('social.callback', 'youtube'))
            ->assertRedirect(route('trainer.profile.edit'));

        $this->assertSame(0, TrainerSocialAccount::count());
    }

    public function test_an_account_linked_to_another_trainer_is_refused()
    {
        $other = $this->approvedTrainer();
        $other->socialAccounts()->create(['provider' => 'instagram', 'provider_user_id' => 'ig-1', 'handle' => 'giulia.fit', 'url' => 'https://www.instagram.com/giulia.fit/', 'connected_at' => now()]);
        $profile = $this->approvedTrainer();
        $this->fakeSocial('instagram', 'ig-1', 'giulia.fit');

        $this->actingAs($profile->user)->get(route('social.callback', 'instagram'));

        $this->assertSame(0, $profile->socialAccounts()->count());
        $this->assertSame(1, $other->socialAccounts()->count());
    }

    public function test_linking_again_updates_the_username()
    {
        $profile = $this->approvedTrainer();
        $this->fakeSocial('instagram', 'ig-1', 'giulia.fit');
        $this->actingAs($profile->user)->get(route('social.callback', 'instagram'));

        $this->fakeSocial('instagram', 'ig-1', 'giulia.coach');
        $this->actingAs($profile->user)->get(route('social.callback', 'instagram'));

        $this->assertSame('giulia.coach', $profile->socialAccounts()->sole()->handle);
    }

    public function test_a_trainer_unlinks_a_social()
    {
        $profile = $this->approvedTrainer();
        $profile->socialAccounts()->create(['provider' => 'tiktok', 'provider_user_id' => 'tt-1', 'handle' => 'giuliafit', 'url' => 'https://www.tiktok.com/@giuliafit', 'connected_at' => now()]);

        $this->actingAs($profile->user)
            ->delete(route('social.disconnect', 'tiktok'))
            ->assertRedirect();

        $this->assertSame(0, $profile->socialAccounts()->count());
    }

    public function test_a_linked_instagram_takes_the_place_of_the_one_typed_by_hand()
    {
        $profile = $this->approvedTrainer();
        $profile->forceFill(['instagram' => 'vecchio.nome'])->save();
        $this->fakeSocial('instagram', 'ig-1', 'giulia.fit');

        $this->actingAs($profile->user)->get(route('social.callback', 'instagram'));

        $this->assertNull($profile->fresh()?->instagram);
        $this->get(route('trainers.show', $profile->slug))
            ->assertInertia(fn (Assert $page) => $page
                ->has('trainer.socials', 1)
                ->where('trainer.socials.0.handle', 'giulia.fit'));
    }

    public function test_a_social_without_app_credentials_cannot_be_linked()
    {
        config(['services.tiktok.client_id' => null]);
        $profile = $this->approvedTrainer();

        $this->actingAs($profile->user)->get(route('social.connect', 'tiktok'))->assertNotFound();
        $this->actingAs($profile->user)->get(route('social.connect', 'linkedin'))->assertNotFound();

        $this->actingAs($profile->user)
            ->get(route('trainer.profile.edit'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('socials.providers', [
                    ['provider' => 'instagram', 'label' => 'Instagram'],
                    ['provider' => 'facebook', 'label' => 'Facebook'],
                    ['provider' => 'youtube', 'label' => 'YouTube'],
                ]));
    }

    public function test_gyms_and_the_team_cannot_link_socials()
    {
        $gym = GymProfile::factory()->create()->user;

        $this->actingAs($gym)->get(route('social.connect', 'instagram'))->assertNotFound();
    }

    public function test_in_diventa_trainer_the_link_waits_for_the_profile()
    {
        $client = User::factory()->create(['name' => 'Luca Moretti']);
        $this->fakeSocial('instagram', 'ig-9', 'luca.coach');

        $this->actingAs($client)
            ->withSession(['trainer_social_popup' => true])
            ->get(route('social.callback', 'instagram'))
            ->assertOk();

        $this->assertSame(0, TrainerSocialAccount::count());

        $this->actingAs($client)
            ->get(route('trainer.register'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('socials.linked', [['provider' => 'instagram', 'handle' => 'luca.coach', 'url' => 'https://www.instagram.com/luca.coach/']]));

        $this->actingAs($client)
            ->post(route('trainer.register.store'), ['terms' => '1', ...$this->registration()])
            ->assertSessionHasNoErrors();

        $account = $client->refresh()->trainerProfile?->socialAccounts()->sole();
        $this->assertSame('luca.coach', $account?->handle);
        $this->assertNull(session(TrainerSocials::PENDING_KEY));
    }

    /**
     * Steps 2–7 of "Diventa trainer" (as in TrainerRegistrationTest).
     *
     * @return array<string, mixed>
     */
    private function registration(): array
    {
        return [
            'headline' => 'Functional training e Pilates',
            'bio' => str_repeat('Alleno persone che vogliono tornare in forma. ', 5),
            'experience' => '5to10',
            'photo' => UploadedFile::fake()->image('ritratto.jpg', 600, 600),
            'disciplines' => ['pilates', 'functional'],
            'goals' => ['posture'],
            'places' => ['online'],
            'studios' => [],
            'city' => '',
            'other_cities' => [],
            'sessions' => [['name' => 'Seduta singola', 'prices' => [['minutes' => '60', 'price_cents' => '4500']], 'note' => '']],
            'first_session' => ['minutes' => '60', 'price_cents' => '3000', 'note' => ''],
            'packages' => [],
            'hours' => [0 => [9, 10]],
            'notice_hours' => '12',
            'booking_window_days' => '60',
            'break_minutes' => '15',
            'max_sessions_per_day' => '6',
            'free_cancellation_hours' => '24',
            'auto_confirm' => '0',
            'certifications' => [],
        ];
    }
}
