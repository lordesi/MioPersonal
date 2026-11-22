<?php

namespace Tests\Feature;

use App\Enums\PushCategory;
use App\Enums\UserRole;
use App\Models\City;
use App\Models\GroupSession;
use App\Models\GymProfile;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Support\Features;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * MioPersonal with the trainers only (config/features.php): gyms, courses
 * and events switched off don't exist for anyone. The other tests run with
 * everything on (phpunit.xml).
 */
class FeaturesOffTest extends TestCase
{
    use RefreshDatabase;

    private City $milano;

    private TrainerProfile $trainer;

    private GymProfile $gym;

    private GroupSession $event;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(CatalogSeeder::class);
        $this->milano = City::where('slug', 'milano')->firstOrFail();
        $this->trainer = TrainerProfile::factory()->approved()->inCity($this->milano)->create();
        $this->gym = GymProfile::factory()->approved()->inCity($this->milano)->create();
        $this->event = GroupSession::factory()->by($this->trainer)->create();

        $this->switchOff();
    }

    private function switchOff(bool $events = false): void
    {
        config(['features.gyms' => false, 'features.courses' => false, 'features.events' => $events]);
    }

    public function test_the_public_pages_of_gyms_courses_and_events_are_not_found()
    {
        $this->get(route('gyms.search'))->assertNotFound();
        $this->get(route('gyms.search', 'milano'))->assertNotFound();
        $this->get(route('gyms.show', $this->gym->slug))->assertNotFound();
        $this->get(route('courses.search'))->assertNotFound();
        $this->get(route('events.search'))->assertNotFound();
        $this->get(route('events.show', $this->event->slug))->assertNotFound();
        $this->get(route('gym.register'))->assertNotFound();
        $this->post(route('gym.register.store'))->assertNotFound();
    }

    public function test_a_client_cannot_take_a_place_nor_save_a_gym()
    {
        $client = User::factory()->create();

        $this->actingAs($client)->post(route('events.register', $this->event->slug))->assertNotFound();
        $this->actingAs($client)->post(route('events.waitlist.join', $this->event->slug))->assertNotFound();
        $this->actingAs($client)->post(route('client.favorites.gyms.store', $this->gym->slug))->assertNotFound();
        $this->assertSame(0, $client->favoriteGyms()->count());
    }

    public function test_the_trainer_area_has_no_events_nor_gyms()
    {
        $this->actingAs($this->trainer->user)->get(route('trainer.events'))->assertNotFound();
        $this->actingAs($this->trainer->user)->get(route('trainer.events.create'))->assertNotFound();
        $this->actingAs($this->trainer->user)->get(route('trainer.gyms'))->assertNotFound();
        $this->actingAs($this->trainer->user)->get(route('trainer.today'))->assertOk();
    }

    public function test_the_gym_area_and_the_admin_pages_are_not_found()
    {
        $this->actingAs($this->gym->user)->get(route('gym.dashboard'))->assertNotFound();

        $admin = User::factory()->admin()->create();
        $this->actingAs($admin)->get(route('admin.gym-verification'))->assertNotFound();
        $this->actingAs($admin)->get(route('admin.events'))->assertNotFound();
        $this->actingAs($admin)->get(route('admin.overview'))->assertOk();
    }

    public function test_the_home_and_the_news_show_the_trainers_only()
    {
        $this->get(route('home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('public/home')
                ->where('features', ['gyms' => false, 'courses' => false, 'events' => false])
                ->where('gyms.items', [])
                ->where('events', [])
                ->has('trainers.items', 1));

        $this->get(route('news'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('public/news')
                ->has('trainers', 1)
                ->where('gyms', [])
                ->where('events', [])
                ->where('seo.title', fn (string $title) => ! str_contains($title, 'palestre')));
    }

    public function test_the_trainer_profile_has_no_events_courses_nor_gyms()
    {
        $this->get(route('trainers.show', $this->trainer->slug))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('public/profile')
                ->where('events', [])
                ->where('courses', [])
                ->where('trainer.gyms', []));
    }

    public function test_search_engines_and_ai_assistants_are_not_told_about_them()
    {
        $sitemap = $this->get(route('sitemap'))->assertOk()->getContent();

        $this->assertStringContainsString(route('trainers.show', $this->trainer->slug), (string) $sitemap);
        $this->assertStringNotContainsString(route('gyms.search'), (string) $sitemap);
        $this->assertStringNotContainsString(route('gyms.show', $this->gym->slug), (string) $sitemap);
        $this->assertStringNotContainsString(route('events.search'), (string) $sitemap);
        $this->assertStringNotContainsString(route('gym.register'), (string) $sitemap);

        $this->get(route('llms'))
            ->assertOk()
            ->assertDontSee(route('gyms.search'), false)
            ->assertDontSee(route('courses.search'), false)
            ->assertDontSee(route('events.search'), false)
            ->assertDontSee('palestre ed eventi');
    }

    public function test_the_notification_settings_skip_events_and_gym_links()
    {
        $this->assertSame(
            [PushCategory::Requests, PushCategory::Cancellations, PushCategory::Bookings, PushCategory::Messages],
            PushCategory::forRole(UserRole::Trainer),
        );
        $this->assertNotContains(PushCategory::Events, PushCategory::forRole(UserRole::Client));
    }

    public function test_the_events_work_without_the_gyms()
    {
        $this->switchOff(events: true);

        $this->get(route('events.search'))->assertOk();
        $this->get(route('events.show', $this->event->slug))->assertOk();
        $this->actingAs($this->trainer->user)->get(route('trainer.events'))->assertOk();
        $this->get(route('gyms.search'))->assertNotFound();
        $this->actingAs($this->trainer->user)->get(route('trainer.gyms'))->assertNotFound();
    }

    public function test_the_courses_need_the_gyms()
    {
        config(['features.courses' => true]);

        $this->assertFalse(Features::courses());
        $this->get(route('courses.search'))->assertNotFound();

        config(['features.gyms' => true]);

        $this->assertTrue(Features::courses());
        $this->get(route('courses.search'))->assertOk();
    }
}
