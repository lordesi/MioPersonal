<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Booking;
use App\Models\GymProfile;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Support\AdminStats;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** "Admin · Statistiche" (App\Support\AdminStats). */
class AdminStatsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo(CarbonImmutable::parse('2026-11-20 12:00', 'Europe/Rome'));
    }

    private function activity(User $user, string $day): void
    {
        DB::table('user_activity_days')->insert(['user_id' => $user->id, 'day' => $day, 'role' => $user->role->value]);
    }

    public function test_the_page_has_every_section()
    {
        $this->actingAs(User::factory()->admin()->create())
            ->get(route('admin.stats'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/stats')
                ->has('stats.kpis', 13)
                ->where('stats.traffic', false)
                ->has('stats.daily', AdminStats::DAYS)
                ->has('stats.monthly', 12)
                ->has('stats.cohorts', 6)
                ->has('stats.churn', 6)
                ->has('stats.funnel', 5)
                ->has('stats.marketplace.trainers', 4)
                ->has('stats.demand.empty')
                ->has('stats.gyms.supply', 4)
                ->has('stats.gyms.topViewed')
            );
    }

    public function test_the_gyms_have_their_own_section_and_searches()
    {
        $gym = GymProfile::factory()->approved()->create(['name' => 'FitLab']);
        GymProfile::factory()->create(['created_at' => now()->subDays(2)]);
        DB::table('gym_profile_views')->insert([
            ['gym_profile_id' => $gym->id, 'day' => '2026-11-19', 'views' => 4],
            ['gym_profile_id' => $gym->id, 'day' => '2026-09-01', 'views' => 10],
        ]);
        DB::table('search_logs')->insert([
            ['city_id' => $gym->city_id, 'disciplines' => '[]', 'goals' => '[]', 'filters' => '[]', 'results' => 0, 'role' => 'guest', 'kind' => 'gym', 'created_at' => now()->subDay()],
            ['city_id' => $gym->city_id, 'disciplines' => '[]', 'goals' => '[]', 'filters' => '[]', 'results' => 1, 'role' => 'guest', 'kind' => 'gym', 'created_at' => now()->subDay()],
            ['city_id' => null, 'disciplines' => '[]', 'goals' => '[]', 'filters' => '[]', 'results' => 3, 'role' => 'guest', 'kind' => 'trainer', 'created_at' => now()->subDay()],
        ]);

        $stats = (new AdminStats)->all();
        $city = $gym->city->name;

        // The gyms' searches stay out of the trainers' demand.
        $this->assertSame(1, $stats['demand']['searches']);
        $this->assertSame(2, $stats['gyms']['searches']);
        $this->assertSame(0.5, $stats['gyms']['emptyRate']);
        $this->assertSame([['source' => $city, 'count' => 2]], $stats['gyms']['searchCities']);
        $this->assertSame(4, $stats['gyms']['views']);
        $this->assertSame([['source' => 'FitLab', 'count' => 4]], $stats['gyms']['topViewed']);
        $this->assertSame([['source' => $city, 'count' => 1]], $stats['gyms']['cities']);
        $this->assertSame([2, 1, 1, 1], array_column($stats['gyms']['supply'], 'count'));

        $kpis = collect($stats['kpis'])->keyBy('key');
        $this->assertSame(2, $kpis['gyms']['value']);
        $this->assertSame(1, $kpis['publishedGyms']['value']);
    }

    /** "Panoramica dei clienti": who logs trainings, with and without a trainer, and who shares. */
    public function test_the_client_overview_numbers()
    {
        $trainer = TrainerProfile::factory()->approved()->create();
        $withTrainer = User::factory()->create();
        $alsoWithTrainer = User::factory()->create();
        $withoutTrainer = User::factory()->create();
        foreach ([$withTrainer, $alsoWithTrainer] as $client) {
            Booking::factory()->for($trainer)->for($client, 'client')->confirmed()->at(now()->subDays(40))->create(['created_at' => now()->subDays(45)]);
        }
        foreach ([$withTrainer, $alsoWithTrainer, $withoutTrainer] as $client) {
            $this->activity($client, '2026-11-19');
        }
        $withTrainer->activityLogs()->create(['done_on' => '2026-11-18', 'kind' => 'running']);
        $withoutTrainer->activityLogs()->create(['done_on' => '2026-11-18', 'kind' => 'walking']);
        $trainer->clientRecords()->create(['user_id' => $withTrainer->id, 'name' => 'A'])
            ->forceFill(['progress_shared_at' => now(), 'shared_note' => 'Brava!', 'shared_note_at' => now()])->save();
        // The client who shares books again; the other doesn't.
        Booking::factory()->for($trainer)->for($withTrainer, 'client')->confirmed()->at(now()->addDay())->create();

        $overview = (new AdminStats)->all()['overview'];

        $this->assertSame(['count' => 1, 'base' => 2, 'rate' => 0.5], $overview['loggingWithTrainer']);
        $this->assertSame(['count' => 1, 'base' => 1, 'rate' => 1.0], $overview['loggingWithoutTrainer']);
        $this->assertSame(['count' => 1, 'base' => 2, 'rate' => 0.5], $overview['sharing']);
        $this->assertSame(1, $overview['notes']);
        $this->assertSame(1.0, $overview['rebookSharing']['rate']);
        $this->assertSame(0.0, $overview['rebookOthers']['rate']);
    }

    public function test_kpis_compare_the_last_30_days_with_the_30_before()
    {
        User::factory()->count(3)->create(['created_at' => now()->subDays(3)]);
        User::factory()->create(['created_at' => now()->subDays(40)]);
        User::factory()->create(['role' => UserRole::Trainer, 'created_at' => now()->subDays(2)]);

        $kpis = collect((new AdminStats)->all()['kpis'])->keyBy('key');

        $this->assertSame([3, 1], [$kpis['clients']['value'], $kpis['clients']['previous']]);
        $this->assertSame(1, $kpis['trainers']['value']);
        // Without Cloudflare's keys: no visits, no comparison.
        $this->assertSame([null, null], [$kpis['visits']['value'], $kpis['visits']['previous']]);
    }

    public function test_app_opens_and_trainers_with_notifications()
    {
        $trainer = User::factory()->create(['role' => 'trainer']);
        $trainer->updatePushSubscription('https://fcm.googleapis.com/fcm/send/abc', 'key', 'token', 'aes128gcm');
        User::factory()->create()->updatePushSubscription('https://fcm.googleapis.com/fcm/send/def', 'key', 'token', 'aes128gcm');

        $this->withHeader('User-Agent', 'Mozilla/5.0 (iPhone)')->get(route('pwa.start'));
        $this->withHeader('User-Agent', 'Mozilla/5.0 (iPhone)')->get(route('pwa.start'));

        $kpis = collect((new AdminStats)->all()['kpis'])->keyBy('key');

        $this->assertSame(2, $kpis['appOpens']['value']);
        // Only the trainers, and no comparison: it's today's number.
        $this->assertSame([1, null], [$kpis['pushTrainers']['value'], $kpis['pushTrainers']['previous']]);
    }

    public function test_done_sessions_and_their_value()
    {
        $trainer = TrainerProfile::factory()->approved()->create();
        Booking::factory()->for($trainer)->confirmed()->create(['starts_at' => now()->subDays(2), 'ends_at' => now()->subDays(2)->addHour(), 'price_cents' => 5000]);
        // Skipped, in the future, or only requested: not done.
        Booking::factory()->for($trainer)->confirmed()->create(['starts_at' => now()->subDay(), 'ends_at' => now()->subDay()->addHour(), 'no_show_at' => now()->subDay(), 'price_cents' => 5000]);
        Booking::factory()->for($trainer)->confirmed()->create(['starts_at' => now()->addDay(), 'ends_at' => now()->addDay()->addHour()]);

        $kpis = collect((new AdminStats)->all()['kpis'])->keyBy('key');

        $this->assertSame(1, $kpis['sessions']['value']);
        $this->assertSame(5000, $kpis['gmv']['value']);
    }

    public function test_churn_and_cohorts_come_from_the_active_days()
    {
        // Signed up in September, both active in September, one back in October.
        $stays = User::factory()->create(['created_at' => '2026-09-05 10:00:00']);
        $leaves = User::factory()->create(['created_at' => '2026-09-06 10:00:00']);
        $this->activity($stays, '2026-09-10');
        $this->activity($leaves, '2026-09-11');
        $this->activity($stays, '2026-10-03');

        $stats = (new AdminStats)->all();

        $october = collect($stats['churn'])->firstWhere('month', '2026-10');
        $this->assertSame(0.5, $october['clients']);
        $this->assertSame(2, $october['clientsBase']);
        $this->assertNull($october['trainers']);

        $september = collect($stats['cohorts'])->firstWhere('month', '2026-09');
        $this->assertSame(2, $september['size']);
        $this->assertSame([1.0, 0.5, 0.0], array_slice($september['retention'], 0, 3));
        // Months not started yet.
        $this->assertNull($september['retention'][3]);
    }

    public function test_searches_without_results_and_signup_channels()
    {
        DB::table('search_logs')->insert([
            ['city_id' => null, 'disciplines' => '["boxe"]', 'goals' => '[]', 'filters' => '[]', 'results' => 0, 'role' => 'guest', 'created_at' => now()->subDay()],
            ['city_id' => null, 'disciplines' => '[]', 'goals' => '[]', 'filters' => '[]', 'results' => 4, 'role' => 'guest', 'created_at' => now()->subDay()],
        ]);
        User::factory()->create(['acquisition' => ['source' => 'instagram', 'medium' => null, 'campaign' => null, 'landing' => '/'], 'created_at' => now()->subDay()]);

        $stats = (new AdminStats)->all();

        $this->assertSame(0.5, $stats['demand']['emptyRate']);
        $this->assertSame([['source' => 'Tutta Italia · boxe', 'count' => 1]], $stats['demand']['empty']);
        $this->assertSame([['source' => 'instagram', 'count' => 1]], $stats['channels']['signups']);
    }

    private function cloudflare(): void
    {
        config(['services.cloudflare' => ['analytics_token' => 'public', 'site_tag' => 'site-tag', 'account_id' => 'account-id', 'api_token' => 'secret']]);
    }

    /** The visits come from Cloudflare Web Analytics, one request, then cached. */
    public function test_the_visits_come_from_cloudflare()
    {
        $this->cloudflare();
        $totals = fn (int $visits, int $views) => [['count' => $views, 'sum' => ['visits' => $visits]]];
        Http::fake(['api.cloudflare.com/*' => Http::response(['data' => ['viewer' => ['accounts' => [[
            'current' => $totals(12, 40),
            'previous' => $totals(4, 10),
            'daily' => [
                // 23:00 UTC is midnight in Rome: the next day.
                ['count' => 5, 'sum' => ['visits' => 2], 'dimensions' => ['datetimeHour' => '2026-11-18T23:00:00Z']],
                ['count' => 3, 'sum' => ['visits' => 1], 'dimensions' => ['datetimeHour' => '2026-11-19T10:00:00Z']],
            ],
            'sources' => [
                ['count' => 9, 'sum' => ['visits' => 6], 'dimensions' => ['refererHost' => '']],
                ['count' => 5, 'sum' => ['visits' => 3], 'dimensions' => ['refererHost' => 'www.google.it']],
                ['count' => 2, 'sum' => ['visits' => 2], 'dimensions' => ['refererHost' => 'l.instagram.com']],
                ['count' => 1, 'sum' => ['visits' => 1], 'dimensions' => ['refererHost' => 'google.com']],
                // Pages opened from inside the site: not visits.
                ['count' => 23, 'sum' => ['visits' => 0], 'dimensions' => ['refererHost' => 'miopersonal.it']],
            ],
            'm202611' => $totals(9, 30),
            'm202610' => $totals(5, 12),
        ]]]], 'errors' => null])]);

        $stats = (new AdminStats)->all();
        $kpis = collect($stats['kpis'])->keyBy('key');

        $this->assertTrue($stats['traffic']);
        $this->assertSame([12, 4], [$kpis['visits']['value'], $kpis['visits']['previous']]);
        $this->assertSame([40, 10], [$kpis['pageViews']['value'], $kpis['pageViews']['previous']]);
        $day = collect($stats['daily'])->firstWhere('day', '2026-11-19');
        $this->assertSame([3, 8], [$day['visits'], $day['pageViews']]);
        $this->assertSame(['direct' => 6, 'google' => 4, 'instagram' => 2], collect($stats['channels']['visits'])->pluck('count', 'source')->all());
        $this->assertSame([9, 5], [collect($stats['monthly'])->firstWhere('month', '2026-11')['visits'], collect($stats['monthly'])->firstWhere('month', '2026-10')['visits']]);
        // Older than Cloudflare's 6 months.
        $this->assertSame(0, collect($stats['monthly'])->firstWhere('month', '2026-01')['visits']);
        $this->assertSame(12, $stats['funnel'][0]['count']);

        Http::assertSent(fn (Request $request) => $request->hasHeader('Authorization', 'Bearer secret')
            && str_contains($request['query'], 'accountTag: "account-id"')
            && str_contains($request['query'], '{siteTag: "site-tag"}')
            && str_contains($request['query'], 'm202606:'));

        // Kept for 10 minutes: no second request.
        (new AdminStats)->all();
        Http::assertSentCount(1);
    }

    public function test_without_cloudflare_the_page_still_opens()
    {
        $this->cloudflare();
        Http::fake(['api.cloudflare.com/*' => Http::response(['data' => null, 'errors' => [['message' => 'not authorized']]])]);

        $stats = (new AdminStats)->all();

        $this->assertFalse($stats['traffic']);
        $this->assertNull(collect($stats['kpis'])->firstWhere('key', 'visits')['value']);
        $this->assertSame(0, $stats['funnel'][0]['count']);

        // After an error, not again at every page.
        (new AdminStats)->all();
        Http::assertSentCount(1);

        $this->actingAs(User::factory()->admin()->create())->get(route('admin.stats'))->assertOk();
    }
}
