<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Booking;
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
                ->has('stats.kpis', 9)
                ->has('stats.daily', AdminStats::DAYS)
                ->has('stats.monthly', 12)
                ->has('stats.cohorts', 6)
                ->has('stats.churn', 6)
                ->has('stats.funnel', 5)
                ->has('stats.marketplace.trainers', 4)
                ->has('stats.demand.empty')
            );
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
