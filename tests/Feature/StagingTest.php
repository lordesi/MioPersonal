<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\User;
use App\Support\Staging;
use Database\Seeders\CatalogSeeder;
use Database\Seeders\StagingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Symfony\Component\HttpFoundation\Request;
use Tests\TestCase;

/** The test copy of the site: closed by a password, not indexed, no real email. */
class StagingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(CatalogSeeder::class);
    }

    protected function tearDown(): void
    {
        // Outside local and tests the app trusts only its own host, and that is kept
        // for the whole process: it must not reach the tests after this one.
        Request::setTrustedHosts([]);

        parent::tearDown();
    }

    private function staging(): void
    {
        $this->app['env'] = Staging::ENVIRONMENT;
        config(['app.staging_user' => 'team', 'app.staging_password' => 'segreto']);
    }

    public function test_the_real_site_asks_for_no_password_and_is_not_marked()
    {
        $this->get(route('home'))->assertOk()->assertHeaderMissing('X-Robots-Tag');
        $this->assertStringNotContainsString('STAGING', (string) $this->get(route('home'))->getContent());
    }

    public function test_staging_asks_for_the_password()
    {
        $this->staging();

        $this->get(route('home'))->assertUnauthorized()->assertHeader('WWW-Authenticate');
        $this->withHeaders(['Authorization' => 'Basic '.base64_encode('team:sbagliata')])->get(route('home'))->assertUnauthorized();
    }

    public function test_staging_opens_with_the_password_and_stays_out_of_search_engines()
    {
        $this->staging();

        $this->withHeaders(['Authorization' => 'Basic '.base64_encode('team:segreto')])
            ->get(route('home'))
            ->assertOk()
            ->assertHeader('X-Robots-Tag', 'noindex, nofollow, noarchive')
            ->assertSee('STAGING', false);
    }

    public function test_staging_without_credentials_stays_closed()
    {
        $this->staging();
        config(['app.staging_user' => null, 'app.staging_password' => null]);

        $this->get(route('home'))->assertStatus(503);
    }

    public function test_robots_txt_lets_the_real_site_be_indexed_but_not_staging()
    {
        $this->get(route('robots'))
            ->assertOk()
            ->assertHeader('Content-Type', 'text/plain; charset=UTF-8')
            ->assertSee('Disallow: /area-trainer', false)
            ->assertSee('Sitemap: '.route('sitemap'), false);

        $this->staging();

        $this->withHeaders(['Authorization' => 'Basic '.base64_encode('team:segreto')])
            ->get(route('robots'))
            ->assertSee('Disallow: /', false)
            ->assertDontSee('Sitemap:', false);
    }

    public function test_staging_writes_emails_in_the_log_whatever_the_env_says()
    {
        config(['mail.default' => 'smtp']);
        Staging::trapMail();
        $this->assertSame('smtp', config('mail.default'));

        $this->staging();
        Staging::trapMail();
        $this->assertSame('log', config('mail.default'));
    }

    public function test_the_reset_command_refuses_to_run_on_the_real_site()
    {
        $user = User::factory()->create();

        $this->artisan('staging:reset')->assertFailed();

        $this->assertDatabaseHas('users', ['id' => $user->id]);
    }

    public function test_the_staging_accounts_can_be_seeded_twice()
    {
        $this->seed(StagingSeeder::class);
        $this->seed(StagingSeeder::class);

        $this->assertSame(UserRole::Admin, User::where('email', 'admin@staging.miopersonal.test')->firstOrFail()->role);
        $this->assertSame(1, User::where('email', 'cliente@staging.miopersonal.test')->count());
    }
}
