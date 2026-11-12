<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Support\AdminStats;
use App\Support\Stats;
use Database\Seeders\CatalogSeeder;
use Database\Seeders\DemoTrainerSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * The history collected for the team's numbers (App\Support\Stats).
 */
class StatsTest extends TestCase
{
    use RefreshDatabase;

    private const BROWSER = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0';

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([CatalogSeeder::class, DemoTrainerSeeder::class]);
        $this->withHeader('User-Agent', self::BROWSER);
    }

    public function test_each_day_of_activity_is_saved_once_with_the_role()
    {
        $client = User::factory()->create(['last_active_at' => null]);

        $this->actingAs($client)->get(route('client.home'));
        $this->actingAs($client->refresh())->get(route('client.favorites'));

        $this->assertSame(1, DB::table('user_activity_days')->where('user_id', $client->id)->count());
        $this->assertSame('client', DB::table('user_activity_days')->where('user_id', $client->id)->value('role'));

        // The next day, a new row, even a few minutes after the last activity.
        $this->travelTo(now('Europe/Rome')->endOfDay()->subMinute());
        $this->actingAs($client)->get(route('client.home'));
        $this->travel(2)->minutes();
        $this->actingAs($client->refresh())->get(route('client.home'));

        // Today (already there) and tomorrow.
        $this->assertSame(2, DB::table('user_activity_days')->where('user_id', $client->id)->count());
    }

    public function test_a_search_is_saved_without_the_user()
    {
        $client = User::factory()->create();

        $this->actingAs($client)->get(route('trainers.search', ['milano', 'disciplina' => 'pilates', 'prezzo' => 'fino-35']));

        $log = DB::table('search_logs')->sole();
        $this->assertSame('client', $log->role);
        $this->assertSame(['pilates'], json_decode($log->disciplines, true));
        $this->assertSame(['prezzo'], json_decode($log->filters, true));
        // Sara Colombo, online only, 30 €.
        $this->assertSame(1, (int) $log->results);
        $this->assertNotNull($log->city_id);
        $this->assertObjectNotHasProperty('user_id', $log);
    }

    public function test_bots_and_prefetch_are_not_searches()
    {
        $this->withHeader('User-Agent', 'Mozilla/5.0 (compatible; Googlebot/2.1)')->get(route('trainers.search'));
        $this->withHeaders(['User-Agent' => self::BROWSER, 'Purpose' => 'prefetch'])->get(route('trainers.search'));

        $this->assertSame(0, DB::table('search_logs')->count());

        $this->withHeaders(['User-Agent' => self::BROWSER, 'Purpose' => ''])->get(route('trainers.search'));
        $log = DB::table('search_logs')->sole();
        $this->assertSame('guest', $log->role);
        $this->assertSame(9, (int) $log->results);
    }

    public function test_page_views_visitors_and_visits_are_counted()
    {
        $this->withHeader('Referer', 'https://www.google.it/')->get(route('home'))
            ->assertCookie(Stats::VISITOR_COOKIE);
        $this->get(route('trainers.search'));
        $this->withHeader('X-Inertia', 'true')->get(route('trainers.show', 'marco-bianchi'));
        // Not pages: the sitemap, a missing page, a bot.
        $this->get(route('sitemap'));
        $this->get('/pagina-che-non-esiste');
        $this->withHeader('User-Agent', 'Googlebot/2.1')->get(route('home'));

        $this->assertSame(3, (int) DB::table('page_view_days')->where('section', 'public')->value('views'));
        // The same browser: one visitor, one visit (from Google).
        $this->assertSame(1, DB::table('visitor_days')->count());
        $this->assertSame(['google' => 1], DB::table('visit_days')->pluck('visits', 'source')->map(fn ($visits) => (int) $visits)->all());
        // The code is not the IP nor the browser.
        $this->assertSame(64, strlen((string) DB::table('visitor_days')->value('visitor')));
    }

    public function test_the_same_browser_is_one_unique_visitor_across_days()
    {
        // Both days in the same month.
        $this->travelTo(now('Europe/Rome')->setDate(2026, 11, 10)->setTime(12, 0));
        $id = str_repeat('a', 40);

        $this->withCookie(Stats::VISITOR_COOKIE, $id)->get(route('home'))
            ->assertCookieMissing(Stats::VISITOR_COOKIE);
        $this->travel(1)->days();
        // Another network or a new session: the cookie decides.
        $this->flushSession();
        $this->withCookie(Stats::VISITOR_COOKIE, $id)->withServerVariables(['REMOTE_ADDR' => '10.0.0.9'])->get(route('home'));
        // Someone else.
        $this->flushSession();
        $this->withCookie(Stats::VISITOR_COOKIE, str_repeat('b', 40))->get(route('home'));

        // One row a day for each.
        $this->assertSame(3, DB::table('visitor_days')->count());

        $kpis = collect((new AdminStats)->all()['kpis'])->keyBy('key');
        $this->assertSame(2, $kpis['visitors']['value']);
        $this->assertSame(2, $kpis['allVisitors']['value']);
        $this->assertSame(2, collect((new AdminStats)->all()['monthly'])->last()['visitors']);
    }

    public function test_stats_reset_empties_the_history()
    {
        $this->get(route('home'));
        $this->assertSame(1, DB::table('visitor_days')->count());

        $this->artisan('stats:reset')->expectsConfirmation('Delete all the visits, page views, searches, profile views and activity days collected so far?', 'yes')->assertSuccessful();

        foreach (Stats::HISTORY_TABLES as $table) {
            $this->assertSame(0, DB::table($table)->count(), $table);
        }
    }

    public function test_campaign_links_and_other_sites_give_the_channel()
    {
        $channel = fn (string $url, ?string $referer = null) => Stats::acquisition(
            Request::create($url, 'GET', server: array_filter(['HTTP_REFERER' => $referer, 'HTTP_HOST' => 'miopersonal.test'])),
        );

        $this->assertSame('instagram', $channel('/?utm_source=Instagram&utm_medium=bio&utm_campaign=lancio')['source']);
        $this->assertSame('lancio', $channel('/?utm_source=instagram&utm_campaign=Lancio')['campaign']);
        $this->assertSame('instagram', $channel('/', 'https://l.instagram.com/?u=x')['source']);
        $this->assertSame('x', $channel('/', 'https://t.co/abc')['source']);
        $this->assertSame('box.com', $channel('/', 'https://www.box.com/')['source']);
        // A link inside the site: not a channel.
        $this->assertSame('direct', $channel('/', 'https://miopersonal.test/personal-trainer')['source']);
        $this->assertSame('direct', $channel('/trainer/marco-bianchi')['source']);
        $this->assertSame('/trainer/marco-bianchi', $channel('/trainer/marco-bianchi')['landing']);
    }

    public function test_a_new_user_keeps_the_channel_of_the_visit()
    {
        $this->get(route('home', ['utm_source' => 'instagram', 'utm_campaign' => 'lancio']));

        $this->post(route('register.store'), [
            'first_name' => 'Anna',
            'last_name' => 'Neri',
            'username' => 'anna-neri',
            'email' => 'anna.neri@example.com',
            'phone' => '347 521 8846',
            'password' => 'Password1',
            'terms' => '1',
        ])->assertSessionHasNoErrors();

        $user = User::where('email', 'anna.neri@example.com')->firstOrFail();
        $this->assertSame('instagram', $user->acquisition['source'] ?? null);
        $this->assertSame('lancio', $user->acquisition['campaign'] ?? null);
    }

    public function test_profile_views_are_counted_per_day()
    {
        $profile = TrainerProfile::where('slug', 'marco-bianchi')->firstOrFail();

        $this->get(route('trainers.show', 'marco-bianchi'));
        $this->get(route('trainers.show', 'marco-bianchi'));
        // Not the trainer, nor the team.
        $this->actingAs($profile->user)->get(route('trainers.show', 'marco-bianchi'));
        $this->actingAs(User::factory()->create(['role' => UserRole::Admin]))->get(route('trainers.show', 'marco-bianchi'));

        $this->assertSame(2, (int) DB::table('trainer_profile_views')->where('trainer_profile_id', $profile->id)->value('views'));
    }
}
