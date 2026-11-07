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
use Illuminate\Support\Facades\DB;
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

    public function test_kpis_compare_the_last_30_days_with_the_30_before()
    {
        User::factory()->count(3)->create(['created_at' => now()->subDays(3)]);
        User::factory()->create(['created_at' => now()->subDays(40)]);
        User::factory()->create(['role' => UserRole::Trainer, 'created_at' => now()->subDays(2)]);
        DB::table('visitor_days')->insert([
            ['day' => '2026-11-19', 'visitor' => str_repeat('a', 64)],
            ['day' => '2026-11-19', 'visitor' => str_repeat('b', 64)],
            ['day' => '2026-10-10', 'visitor' => str_repeat('c', 64)],
        ]);

        $kpis = collect((new AdminStats)->all()['kpis'])->keyBy('key');

        $this->assertSame([3, 1], [$kpis['clients']['value'], $kpis['clients']['previous']]);
        $this->assertSame(1, $kpis['trainers']['value']);
        $this->assertSame([2, 1], [$kpis['visitors']['value'], $kpis['visitors']['previous']]);
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

    public function test_searches_without_results_and_channels()
    {
        DB::table('search_logs')->insert([
            ['city_id' => null, 'disciplines' => '["boxe"]', 'goals' => '[]', 'filters' => '[]', 'results' => 0, 'role' => 'guest', 'created_at' => now()->subDay()],
            ['city_id' => null, 'disciplines' => '[]', 'goals' => '[]', 'filters' => '[]', 'results' => 4, 'role' => 'guest', 'created_at' => now()->subDay()],
        ]);
        DB::table('visit_days')->insert([
            ['day' => '2026-11-18', 'source' => 'instagram', 'visits' => 5],
            ['day' => '2026-11-19', 'source' => 'instagram', 'visits' => 2],
            ['day' => '2026-11-19', 'source' => 'direct', 'visits' => 3],
        ]);
        User::factory()->create(['acquisition' => ['source' => 'instagram', 'medium' => null, 'campaign' => null, 'landing' => '/'], 'created_at' => now()->subDay()]);

        $stats = (new AdminStats)->all();

        $this->assertSame(0.5, $stats['demand']['emptyRate']);
        $this->assertSame([['source' => 'Tutta Italia · boxe', 'count' => 1]], $stats['demand']['empty']);
        $this->assertSame([['source' => 'instagram', 'count' => 7], ['source' => 'direct', 'count' => 3]], $stats['channels']['visits']);
        $this->assertSame([['source' => 'instagram', 'count' => 1]], $stats['channels']['signups']);
    }
}
