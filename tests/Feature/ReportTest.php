<?php

namespace Tests\Feature;

use App\Enums\ReportReason;
use App\Models\GymProfile;
use App\Models\Report;
use App\Models\Review;
use App\Models\TrainerProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ReportTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_report()
    {
        $profile = TrainerProfile::factory()->approved()->create();

        $this->post(route('reports.store'), ['type' => 'trainer', 'target' => $profile->slug, 'reason' => 'spam'])
            ->assertRedirect(route('login'));

        $this->assertDatabaseCount('reports', 0);
    }

    public function test_a_user_reports_a_trainer_a_gym_and_a_review()
    {
        $user = User::factory()->create();
        $trainer = TrainerProfile::factory()->approved()->create();
        $gym = GymProfile::factory()->approved()->create();
        $review = Review::factory()->create();

        $this->actingAs($user)->from(route('trainers.show', $trainer->slug))
            ->post(route('reports.store'), ['type' => 'trainer', 'target' => $trainer->slug, 'reason' => 'fake', 'details' => '  Foto rubate  '])
            ->assertRedirect(route('trainers.show', $trainer->slug))
            ->assertInertiaFlash('toast.type', 'success');
        $this->actingAs($user)->post(route('reports.store'), ['type' => 'gym', 'target' => $gym->slug, 'reason' => 'spam']);
        $this->actingAs($user)->post(route('reports.store'), ['type' => 'review', 'target' => (string) $review->id, 'reason' => 'offensive']);

        $this->assertSame(3, Report::count());
        $report = Report::query()->whereMorphedTo('reportable', $trainer)->sole();
        $this->assertSame(ReportReason::Fake, $report->reason);
        $this->assertSame('Foto rubate', $report->details);
        $this->assertSame($user->id, $report->reporter_id);
    }

    public function test_reporting_again_updates_the_open_report()
    {
        $user = User::factory()->create();
        $trainer = TrainerProfile::factory()->approved()->create();

        $this->actingAs($user)->post(route('reports.store'), ['type' => 'trainer', 'target' => $trainer->slug, 'reason' => 'fake']);
        $this->actingAs($user)->post(route('reports.store'), ['type' => 'trainer', 'target' => $trainer->slug, 'reason' => 'spam']);

        $this->assertSame(ReportReason::Spam, Report::sole()->reason);
    }

    public function test_hidden_or_unapproved_contents_and_own_profiles_cannot_be_reported()
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post(route('reports.store'), ['type' => 'trainer', 'target' => TrainerProfile::factory()->create()->slug, 'reason' => 'spam'])->assertNotFound();
        $this->actingAs($user)->post(route('reports.store'), ['type' => 'review', 'target' => (string) Review::factory()->hidden()->create()->id, 'reason' => 'spam'])->assertNotFound();
        $this->actingAs($user)->post(route('reports.store'), ['type' => 'trainer', 'target' => 'x', 'reason' => 'nope'])->assertSessionHasErrors('reason');

        $own = TrainerProfile::factory()->approved()->create();
        $this->actingAs($own->user)->post(route('reports.store'), ['type' => 'trainer', 'target' => $own->slug, 'reason' => 'spam'])
            ->assertInertiaFlash('toast.type', 'error');

        $this->assertDatabaseCount('reports', 0);
    }

    public function test_the_team_hides_a_reported_review_and_closes_every_report_of_it()
    {
        $review = Review::factory()->create();
        foreach (User::factory()->count(2)->create() as $user) {
            $this->actingAs($user)->post(route('reports.store'), ['type' => 'review', 'target' => (string) $review->id, 'reason' => 'offensive']);
        }

        $admin = User::factory()->admin()->create();
        $this->actingAs($admin)->get(route('admin.reports'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/reports')
                ->where('adminArea.openReports', 1)
                ->has('reports', 2)
                ->where('reports.0.subject.kind', 'review')
                ->where('reports.0.reason', 'Contenuti offensivi o inappropriati')
                ->where('reports.0.resolution', null)
            );

        $this->actingAs($admin)->post(route('admin.reports.resolve', Report::first()), ['resolution' => 'removed'])->assertRedirect();

        $this->assertNotNull($review->fresh()->hidden_at);
        $this->assertSame(0, Report::open()->count());
        $this->assertSame(2, Report::where('resolution', Report::REMOVED)->where('resolved_by', $admin->id)->count());
    }

    public function test_dismissing_a_report_leaves_the_content_alone()
    {
        $trainer = TrainerProfile::factory()->approved()->create();
        $this->actingAs(User::factory()->create())->post(route('reports.store'), ['type' => 'trainer', 'target' => $trainer->slug, 'reason' => 'spam']);

        $this->actingAs(User::factory()->admin()->create())
            ->post(route('admin.reports.resolve', Report::sole()), ['resolution' => 'dismissed']);

        $this->assertSame(Report::DISMISSED, Report::sole()->resolution);
        $this->assertTrue($trainer->fresh()->isApproved());
    }

    public function test_only_admins_see_the_reports()
    {
        $this->actingAs(User::factory()->create())->get(route('admin.reports'))->assertForbidden();
    }
}
