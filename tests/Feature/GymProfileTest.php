<?php

namespace Tests\Feature;

use App\Enums\GymAmenity;
use App\Enums\GymPlanPeriod;
use App\Models\City;
use App\Models\GymProfile;
use App\Models\GymPromotion;
use App\Models\TrainerProfile;
use App\Models\User;
use Carbon\CarbonImmutable;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** The public page of a gym, its plans and promotions, and the gyms' search. */
class GymProfileTest extends TestCase
{
    use RefreshDatabase;

    private City $milano;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(CatalogSeeder::class);
        $this->milano = City::where('slug', 'milano')->firstOrFail();
    }

    public function test_the_public_page_shows_the_gym_with_its_seo()
    {
        $gym = GymProfile::factory()->approved()->inCity($this->milano)->withHours()->withPlan(4500)->create(['name' => 'FitLab']);

        $this->get(route('gyms.show', $gym->slug))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('public/gym')
                ->where('gym.name', 'FitLab')
                ->where('gym.city.slug', 'milano')
                ->where('gym.plans.0.priceCents', 4500)
                ->where('gym.plans.0.suffix', '/mese')
                ->where('gym.monthlyFromCents', 4500)
                ->has('gym.hours', 7)
                ->where('gym.mapsUrl', fn (string $url) => str_starts_with($url, 'https://www.google.com/maps/search/?api=1&query=FitLab'))
                ->where('preview', false)
                ->where('seo.index', true)
                ->where('seo.jsonLd.0.@type', 'ExerciseGym')
                ->where('seo.jsonLd.0.address.addressLocality', 'Milano')
                ->where('seo.jsonLd.0.makesOffer.0.price', '45.00')
            );

        $this->assertSame(1, (int) DB::table('gym_profile_views')->where('gym_profile_id', $gym->id)->value('views'));
    }

    public function test_a_gym_in_review_is_seen_only_by_its_owner_and_the_team()
    {
        $gym = GymProfile::factory()->create();

        $this->get(route('gyms.show', $gym->slug))->assertNotFound();
        $this->actingAs($gym->user)->get(route('gyms.show', $gym->slug))
            ->assertInertia(fn (Assert $page) => $page->where('preview', true)->where('seo.index', false));
        $this->actingAs(User::factory()->admin()->create())->get(route('gyms.show', $gym->slug))->assertOk();
    }

    public function test_only_the_promotions_of_today_are_public()
    {
        $this->travelTo(CarbonImmutable::parse('2026-11-10 12:00', 'Europe/Rome'));
        $gym = GymProfile::factory()->approved()->create();
        $gym->promotions()->create(['title' => 'Oggi', 'discount_percent' => 20, 'starts_on' => '2026-11-10', 'ends_on' => '2026-11-10']);
        $gym->promotions()->create(['title' => 'Scaduta', 'discount_percent' => 20, 'ends_on' => '2026-11-09']);
        $gym->promotions()->create(['title' => 'Futura', 'discount_percent' => 20, 'starts_on' => '2026-11-11']);

        $this->get(route('gyms.show', $gym->slug))
            ->assertInertia(fn (Assert $page) => $page
                ->has('gym.promotions', 1)
                ->where('gym.promotions.0.title', 'Oggi')
            );
    }

    public function test_plans_are_saved_together_and_set_the_monthly_price()
    {
        $gym = GymProfile::factory()->approved()->create();

        $this->actingAs($gym->user)->put(route('gym.plans.update'), ['plans' => [
            ['name' => 'Annuale', 'period' => 'yearly', 'price_cents' => 42000, 'features' => ['Tutto incluso'], 'is_active' => true],
            ['name' => '10 ingressi', 'period' => 'entries', 'entries_count' => 10, 'price_cents' => 8000, 'is_active' => true],
            ['name' => 'Nascosto', 'period' => 'monthly', 'price_cents' => 1000, 'is_active' => false],
        ]])->assertRedirect(route('gym.plans'));

        // 420 € a year = 35 €/month; entries and hidden plans don't count.
        $this->assertSame(3500, $gym->fresh()->monthly_from_cents);
        $this->assertSame(GymPlanPeriod::Entries, $gym->plans()->where('name', '10 ingressi')->value('period'));

        // A pack of entries needs how many.
        $this->put(route('gym.plans.update'), ['plans' => [
            ['name' => 'Ingressi', 'period' => 'entries', 'price_cents' => 8000],
        ]])->assertSessionHasErrors('plans.0.entries_count');
    }

    public function test_a_promotion_has_a_price_or_a_discount_and_a_plan_of_the_gym()
    {
        $gym = GymProfile::factory()->approved()->withPlan()->create();
        $other = GymProfile::factory()->approved()->withPlan()->create();

        $this->actingAs($gym->user)->post(route('gym.promotions.store'), [
            'title' => 'Settembre',
            'kind' => 'percent',
            'discount_percent' => 95,
            'gym_plan_id' => $other->plans()->value('id'),
        ])->assertSessionHasErrors(['discount_percent', 'gym_plan_id']);

        $this->post(route('gym.promotions.store'), [
            'title' => 'Iscrizione gratis',
            'kind' => 'price',
            'promo_price_cents' => 3900,
            'gym_plan_id' => $gym->plans()->value('id'),
        ])->assertRedirect(route('gym.promotions'));

        $promotion = GymPromotion::firstOrFail();
        $this->assertSame(3900, $promotion->promo_price_cents);
        $this->assertNull($promotion->discount_percent);

        // Another gym can't touch it.
        $this->actingAs($other->user)->delete(route('gym.promotions.destroy', $promotion))->assertNotFound();
    }

    public function test_the_search_filters_by_city_services_budget_and_promotions()
    {
        $roma = City::where('slug', 'roma')->firstOrFail();
        $pool = GymProfile::factory()->approved()->inCity($this->milano)->withPlan(3000)
            ->withAmenities([GymAmenity::Pool, GymAmenity::Sauna])->create(['name' => 'Acqua Club']);
        $cheap = GymProfile::factory()->approved()->inCity($this->milano)->withPlan(3001)
            ->withAmenities([GymAmenity::Weights])->create(['name' => 'Ferro']);
        GymProfile::factory()->approved()->inCity($roma)->withAmenities([GymAmenity::Pool])->create();
        GymProfile::factory()->inCity($this->milano)->create(['name' => 'In revisione']);
        $cheap->promotions()->create(['title' => 'Promo', 'discount_percent' => 10]);

        $names = fn (string $url) => collect($this->get($url)->viewData('page')['props']['gyms'])->pluck('name')->sort()->values()->all();

        $this->assertSame(['Acqua Club', 'Ferro'], $names(route('gyms.search', 'milano')));
        $this->assertSame(['Acqua Club'], $names(route('gyms.search', ['milano', 'servizi' => 'piscina,sauna'])));
        // 30 € is "Fino a 30 €", 30,01 € is "30–50 €".
        $this->assertSame(['Acqua Club'], $names(route('gyms.search', ['milano', 'prezzo' => 'fino-30'])));
        $this->assertSame(['Ferro'], $names(route('gyms.search', ['milano', 'prezzo' => '30-50'])));
        $this->assertSame(['Ferro'], $names(route('gyms.search', ['milano', 'promo' => '1'])));
        $this->assertSame(['Acqua Club'], $names(route('gyms.search', ['milano', 'nome' => 'acqua'])));

        $this->get(route('gyms.search', 'milano'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('public/gym-search')
                ->where('total', 2)
                ->where('seo.index', true)
                ->where('gyms.0.href', fn (string $href) => str_starts_with($href, '/palestra/'))
            );

        $this->assertDatabaseHas('search_logs', ['kind' => 'gym']);
        $this->assertNotNull($pool);
    }

    public function test_an_empty_search_suggests_the_other_gyms_of_the_city()
    {
        GymProfile::factory()->approved()->inCity($this->milano)->create(['name' => 'Ferro']);

        $this->get(route('gyms.search', ['milano', 'servizi' => 'piscina']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('total', 0)
                ->where('suggestions.step', 'city')
                ->where('suggestions.gyms.0.name', 'Ferro')
                ->where('seo.index', false)
            );
    }

    public function test_the_sitemap_lists_the_gyms_even_without_trainers()
    {
        $gym = GymProfile::factory()->approved()->inCity($this->milano)->create();

        $this->get(route('sitemap'))
            ->assertOk()
            ->assertSee(route('gyms.search'), false)
            ->assertSee(route('gyms.search', 'milano'), false)
            ->assertSee(route('gyms.show', $gym->slug), false);
    }

    public function test_the_home_has_the_gyms_search_options()
    {
        TrainerProfile::factory()->approved()->create();

        $this->get(route('home'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('amenities', count(GymAmenity::cases()))
                ->whereType('cities.0.lat', 'double')
            );
    }
}
