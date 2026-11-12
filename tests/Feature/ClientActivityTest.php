<?php

namespace Tests\Feature;

use App\Actions\Account\DeleteUser;
use App\Enums\ActivityKind;
use App\Models\ActivityLog;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** "Segna un allenamento" and the weekly goal, in "Panoramica". */
class ClientActivityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo(CarbonImmutable::parse('2026-11-12 10:00', 'Europe/Rome'));
    }

    public function test_a_client_logs_a_training_and_sees_it_counted()
    {
        $client = User::factory()->create();

        $this->actingAs($client)
            ->post(route('client.activities.store'), [
                'done_on' => '2026-11-11',
                'kind' => 'running',
                'minutes' => 40,
                'effort' => 2,
                'note' => 'Lungo il fiume',
            ])
            ->assertSessionHasNoErrors();

        $log = ActivityLog::sole();
        $this->assertSame($client->id, $log->user_id);
        $this->assertSame(ActivityKind::Running, $log->kind);
        $this->assertSame('2026-11-11', $log->done_on);

        $this->get(route('client.home'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('progress.thisWeek', 1)
                ->where('progress.recent.0.label', 'Corsa · 40 min')
                ->where('progress.recent.0.source', 'log')
                ->where('progress.recent.0.logId', $log->id)
                ->has('activityKinds', count(ActivityKind::cases()))
                ->where('today', '2026-11-12')
            );
    }

    public function test_only_the_last_sixty_days_and_never_tomorrow()
    {
        $client = User::factory()->create();
        $post = fn (string $day) => $this->actingAs($client)->post(route('client.activities.store'), ['done_on' => $day, 'kind' => 'other']);

        $post('2026-11-13')->assertSessionHasErrors('done_on');
        $post('2026-09-12')->assertSessionHasErrors('done_on');
        $post('2026-09-13')->assertSessionHasNoErrors();
        $post('2026-11-12')->assertSessionHasNoErrors();
        $this->actingAs($client)->post(route('client.activities.store'), ['done_on' => '2026-11-12', 'kind' => 'karate'])
            ->assertSessionHasErrors('kind');

        $this->assertSame(2, ActivityLog::count());
    }

    public function test_a_client_deletes_only_their_own_trainings()
    {
        $client = User::factory()->create();
        $mine = $client->activityLogs()->create(['done_on' => '2026-11-10', 'kind' => 'walking']);
        $other = User::factory()->create()->activityLogs()->create(['done_on' => '2026-11-10', 'kind' => 'walking']);

        $this->actingAs($client)->delete(route('client.activities.destroy', $other))->assertNotFound();
        $this->actingAs($client)->delete(route('client.activities.destroy', $mine))->assertRedirect();

        $this->assertModelMissing($mine);
        $this->assertModelExists($other);
    }

    public function test_the_weekly_goal_is_the_answer_of_su_di_te()
    {
        $client = User::factory()->create();

        $this->actingAs($client)->put(route('client.goal.update'), ['sessions_per_week' => 3])->assertSessionHasNoErrors();
        $this->assertSame(3, $client->clientPreference()->value('sessions_per_week'));

        $this->put(route('client.goal.update'), ['sessions_per_week' => 8])->assertSessionHasErrors('sessions_per_week');

        $this->get(route('client.home'))->assertInertia(fn (Assert $page) => $page->where('progress.goal', 3));
    }

    public function test_the_trainings_go_with_the_account()
    {
        $client = User::factory()->create();
        $client->activityLogs()->create(['done_on' => '2026-11-10', 'kind' => 'walking']);

        app(DeleteUser::class)->handle($client);

        $this->assertSame(0, ActivityLog::count());
    }
}
