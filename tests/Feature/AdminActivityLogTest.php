<?php

namespace Tests\Feature;

use App\Models\AdminActivity;
use App\Models\City;
use App\Models\GymProfile;
use App\Models\Report;
use App\Models\Review;
use App\Models\TrainerProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminActivityLogTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        Notification::fake();
        $this->admin = User::factory()->admin()->create(['name' => 'Giulia Team']);
    }

    /** @return list<string> */
    private function actions(): array
    {
        return AdminActivity::query()->oldest('id')->pluck('action')->all();
    }

    public function test_decisions_on_trainers_and_gyms_are_recorded()
    {
        $trainer = TrainerProfile::factory()->create(['status' => 'review']);
        $gym = GymProfile::factory()->create(['status' => 'review']);

        $this->actingAs($this->admin)->post(route('admin.verification.decide', $trainer), ['decision' => 'rejected', 'message' => 'Mancano i documenti.']);
        $this->actingAs($this->admin)->post(route('admin.gym-verification.decide', $gym), ['decision' => 'rejected', 'message' => 'Mancano i documenti.']);

        $this->assertSame(['trainer.rejected', 'gym.rejected'], $this->actions());

        $line = AdminActivity::query()->oldest('id')->first();
        $this->assertSame($this->admin->id, $line->admin_id);
        $this->assertSame("Profilo trainer di {$trainer->user->name} rifiutato", $line->description);
        $this->assertTrue($line->subject_type === $trainer->getMorphClass() && $line->subject_id === $trainer->id);
    }

    public function test_moderation_users_and_catalog_are_recorded()
    {
        $review = Review::factory()->create();
        $client = User::factory()->create();
        $city = City::factory()->create();

        $this->actingAs($this->admin)->post(route('admin.reviews.hide', $review));
        $this->actingAs($this->admin)->delete(route('admin.reviews.show', $review));
        $this->actingAs($this->admin)->post(route('admin.users.suspend', $client));
        $this->actingAs($this->admin)->delete(route('admin.users.reactivate', $client));
        $this->actingAs($this->admin)->patch(route('admin.cities.update', $city), [
            'name' => $city->name,
            'province_code' => $city->province_code,
            'region' => $city->region,
            'coordinates' => $city->lat.', '.$city->lng,
            'is_active' => '0',
        ]);

        $this->assertSame(['review.hidden', 'review.shown', 'user.suspended', 'user.reactivated', 'city.updated'], $this->actions());
        $this->assertStringEndsWith('(nascosta)', AdminActivity::query()->latest('id')->value('description'));
    }

    public function test_closing_a_report_is_recorded()
    {
        $review = Review::factory()->create();
        $this->actingAs(User::factory()->create())
            ->post(route('reports.store'), ['type' => 'review', 'target' => (string) $review->id, 'reason' => 'spam']);

        $this->actingAs($this->admin)->post(route('admin.reports.resolve', Report::sole()), ['resolution' => 'removed']);

        $this->assertSame(['report.removed'], $this->actions());
    }

    public function test_the_overview_shows_the_latest_lines_and_settings_all_of_them()
    {
        $this->actingAs($this->admin);
        foreach (range(1, 10) as $number) {
            AdminActivity::log('city.created', null, "Città {$number} aggiunta");
        }

        $this->get(route('admin.overview'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('activity', 8)
                ->where('activity.0.description', 'Città 10 aggiunta')
                ->where('activity.0.adminName', 'Giulia Team')
            );

        $this->get(route('admin.settings'))
            ->assertInertia(fn (Assert $page) => $page->has('activity', 10));
    }
}
