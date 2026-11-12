<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Review;
use App\Models\TrainerProfile;
use App\Models\User;
use Database\Seeders\CatalogSeeder;
use Database\Seeders\DemoTrainerSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * The `seo` prop of the public pages and the meta tags Laravel writes from it
 * (resources/views/partials/seo.blade.php).
 */
class SeoTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([CatalogSeeder::class, DemoTrainerSeeder::class]);
    }

    public function test_home_has_title_description_and_json_ld()
    {
        $this->get(route('home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('seo.title', 'Trova il tuo personal trainer')
                ->where('seo.index', true)
                ->where('seo.canonical', route('home'))
                ->where('seo.jsonLd.1.@type', 'WebSite')
            )
            ->assertSee('<title>Trova il tuo personal trainer - '.config('app.name').'</title>', false)
            ->assertSee('<meta name="description" content="Cerca personal trainer verificati', false)
            ->assertSee('<meta name="robots" content="index, follow, max-image-preview:large">', false)
            ->assertSee('<link rel="canonical" href="'.route('home').'">', false)
            ->assertSee('<meta property="og:title" content="Trova il tuo personal trainer - '.config('app.name').'">', false)
            ->assertSee('<script type="application/ld+json">', false);
    }

    public function test_a_city_page_is_indexed_with_its_count()
    {
        $this->get(route('trainers.search', 'milano'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('seo.title', 'Personal trainer a Milano')
                ->where('seo.index', true)
                ->where('seo.canonical', route('trainers.search', 'milano'))
                ->where('seo.description', fn (string $description) => str_starts_with($description, '5 personal trainer verificati a Milano.'))
                ->where('seo.jsonLd.0.@type', 'BreadcrumbList')
                ->where('seo.jsonLd.1.@type', 'ItemList')
                ->has('seo.jsonLd.1.itemListElement', 5)
            );
    }

    public function test_indexed_city_pages_have_an_intro()
    {
        // Giulia, Marco, Andrea and Elena (Monza, also Milano): not Sara, online only.
        $this->get(route('trainers.search', 'milano'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('intro', fn (string $intro) => str_starts_with($intro, 'A Milano ci sono 4 personal trainer verificati su MioPersonal, per discipline come '))
            );

        $this->get(route('trainers.search', 'bergamo'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('intro', fn (string $intro) => str_starts_with($intro, "A Bergamo c'è 1 personal trainer verificato"))
            );

        $this->get(route('trainers.search', ['milano', 'disciplina' => 'pilates']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('intro', fn (string $intro) => str_starts_with($intro, 'A Milano ci sono 2 personal trainer verificati di pilates'))
            );

        // All of Italy: every published trainer, online-only ones included.
        $this->get(route('trainers.search'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('intro', fn (string $intro) => str_starts_with($intro, 'Su MioPersonal ci sono 9 personal trainer verificati in 5 città italiane')
                    && str_contains($intro, 'La valutazione media è '))
            );

        // Not indexed: no intro.
        $this->get(route('trainers.search', ['milano', 'prezzo' => 'fino-35']))
            ->assertInertia(fn (Assert $page) => $page->where('intro', null));
    }

    public function test_indexed_search_pages_answer_the_common_questions()
    {
        $this->get(route('trainers.search', 'milano'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('faq.0.question', 'Dove trovare un personal trainer a Milano?')
                ->where('faq.0.answer', fn (string $answer) => str_starts_with($answer, 'Su MioPersonal trovi 4 personal trainer a Milano'))
                ->where('faq.1.question', 'Quanto costa un personal trainer a Milano?')
                // The same questions in the FAQPage, after the breadcrumbs and the list.
                ->where('seo.jsonLd.2.@type', 'FAQPage')
                ->where('seo.jsonLd.2.mainEntity.0.name', 'Dove trovare un personal trainer a Milano?')
            );

        $this->get(route('trainers.search', ['milano', 'disciplina' => 'pilates']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('faq.0.question', 'Dove trovare un personal trainer di pilates a Milano?')
            );

        // Not on the pages not indexed.
        $this->get(route('trainers.search', ['milano', 'prezzo' => 'fino-35']))
            ->assertInertia(fn (Assert $page) => $page->where('faq', []));
    }

    public function test_how_it_works_explains_miopersonal()
    {
        $this->get(route('how-it-works'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('public/how-it-works')
                ->where('seo.title', 'Come funziona MioPersonal')
                ->where('seo.index', true)
                ->where('faq.0.question', 'Cos’è MioPersonal?')
                ->where('seo.jsonLd.0.@type', 'FAQPage')
            )
            ->assertSee('<meta name="description" content="MioPersonal è la piattaforma italiana', false);
    }

    public function test_the_home_describes_the_organization()
    {
        config(['app.same_as' => ['https://www.instagram.com/miopersonal']]);

        $this->get(route('home'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('seo.jsonLd.0.@type', 'Organization')
                ->where('seo.jsonLd.0.description', fn (string $description) => str_starts_with($description, 'MioPersonal è la piattaforma italiana'))
                ->where('seo.jsonLd.0.sameAs', ['https://www.instagram.com/miopersonal'])
                ->where('seo.jsonLd.0.contactPoint.email', config('mail.contact_address'))
            );
    }

    public function test_llms_txt_lists_the_cities_with_trainers()
    {
        $this->get(route('llms'))
            ->assertOk()
            ->assertHeader('Content-Type', 'text/markdown; charset=UTF-8')
            ->assertSee('# '.config('app.name'))
            ->assertSee('- [Personal trainer a Milano]('.route('trainers.search', 'milano').'): 4 personal trainer verificati', false)
            ->assertSee('### Cos’è MioPersonal?');
    }

    public function test_robots_txt_welcomes_the_ai_crawlers_with_the_same_rules()
    {
        $robots = $this->get(route('robots'))->assertOk()->getContent();

        foreach (['OAI-SearchBot', 'GPTBot', 'ClaudeBot', 'Claude-SearchBot', 'PerplexityBot', 'Google-Extended'] as $crawler) {
            $this->assertStringContainsString("User-agent: {$crawler}\n", $robots);
        }
        // Their group has the private paths too: a crawler with its own group ignores "*".
        $this->assertSame(2, substr_count($robots, "Disallow: /area-cliente\n"));
        $this->assertStringContainsString('Sitemap: '.route('sitemap'), $robots);
    }

    public function test_pages_without_a_photo_share_the_default_image()
    {
        $this->get(route('home'))
            ->assertSee('<meta property="og:image" content="'.asset('images/og-default.png').'">', false)
            ->assertSee('<meta name="twitter:card" content="summary_large_image">', false);
    }

    public function test_one_discipline_is_indexed_with_its_own_canonical()
    {
        $this->get(route('trainers.search', ['milano', 'disciplina' => 'pilates']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('seo.title', 'Pilates a Milano: personal trainer')
                ->where('seo.index', true)
                ->where('seo.canonical', route('trainers.search', 'milano').'?disciplina=pilates')
            );
    }

    public function test_other_filters_and_empty_pages_are_not_indexed()
    {
        // Endless variants of the same list.
        foreach ([
            ['milano', 'prezzo' => 'fino-35'],
            ['milano', 'ordina' => 'prezzo'],
            ['milano', 'disciplina' => 'pilates,yoga'],
            ['milano', 'nome' => 'marco'],
        ] as $parameters) {
            $this->get(route('trainers.search', $parameters))
                ->assertInertia(fn (Assert $page) => $page->where('seo.index', false))
                ->assertSee('<meta name="robots" content="noindex, follow">', false)
                ->assertDontSee('rel="canonical"', false);
        }

        // Nobody there.
        $this->get(route('trainers.search', ['milano', 'disciplina' => 'boxe']))
            ->assertInertia(fn (Assert $page) => $page->where('total', 0)->where('seo.index', false));
    }

    public function test_a_city_with_only_online_trainers_is_not_indexed()
    {
        // Sara Colombo (online only) shows up in Agrigento too: not a page of its own.
        $this->get(route('trainers.search', 'agrigento'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('total', 1)
                ->where('seo.index', false)
            );
    }

    public function test_a_trainer_profile_has_its_name_city_and_rating()
    {
        $profile = TrainerProfile::where('slug', 'marco-bianchi')->firstOrFail();

        $this->get(route('trainers.show', 'marco-bianchi'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('seo.title', 'Marco Bianchi, personal trainer a Milano')
                ->where('seo.index', true)
                ->where('seo.canonical', route('trainers.show', 'marco-bianchi'))
                ->where('seo.type', 'profile')
                ->where('seo.jsonLd.0.@type', 'ProfessionalService')
                ->where('seo.jsonLd.0.aggregateRating.reviewCount', $profile->rating_count)
                ->where('seo.jsonLd.0.aggregateRating.ratingValue', $profile->rating())
                ->where('seo.jsonLd.1.@type', 'BreadcrumbList')
                ->where('seo.jsonLd.2.@type', 'Person')
                ->where('seo.jsonLd.2.name', 'Marco Bianchi')
                ->where('seo.jsonLd.0.founder.@id', route('trainers.show', 'marco-bianchi').'#person')
                ->where('seo.jsonLd.0.hasOfferCatalog.itemListElement.0.priceCurrency', 'EUR')
            )
            ->assertSee('<meta property="og:type" content="profile">', false);
    }

    public function test_the_json_ld_has_the_last_real_reviews()
    {
        $profile = TrainerProfile::where('slug', 'marco-bianchi')->firstOrFail();
        $booking = Booking::factory()->create(['trainer_profile_id' => $profile->id]);
        Review::factory()->for($profile, 'trainerProfile')->create(['booking_id' => $booking->id, 'client_id' => $booking->client_id, 'text' => 'Seduta ottima, molto preparato.']);
        $hidden = Booking::factory()->create(['trainer_profile_id' => $profile->id]);
        Review::factory()->for($profile, 'trainerProfile')->hidden()->rating(1)->create(['booking_id' => $hidden->id, 'client_id' => $hidden->client_id]);

        $this->get(route('trainers.show', 'marco-bianchi'))
            ->assertInertia(fn (Assert $page) => $page
                // The demo reviews (no booking) and the hidden one are left out.
                ->has('seo.jsonLd.0.review', 1)
                ->where('seo.jsonLd.0.review.0.reviewBody', 'Seduta ottima, molto preparato.')
                ->where('seo.jsonLd.0.review.0.reviewRating.ratingValue', 5)
            );
    }

    public function test_the_json_ld_in_the_html_is_valid_and_safe()
    {
        $profile = TrainerProfile::where('slug', 'marco-bianchi')->firstOrFail();
        $profile->forceFill(['headline' => 'Forza </script><script>alert(1)</script>'])->save();

        $html = $this->get(route('trainers.show', 'marco-bianchi'))->assertOk()->getContent();

        $this->assertSame(1, preg_match('#<script type="application/ld\+json">(.*?)</script>#s', $html, $match));
        $this->assertStringNotContainsString('<script>alert', $html);

        $data = json_decode($match[1], true, flags: JSON_THROW_ON_ERROR);
        $this->assertSame('https://schema.org', $data['@context']);
        $this->assertSame('Forza </script><script>alert(1)</script>', $data['@graph'][0]['description']);
        // One session, not the packages.
        $this->assertStringNotContainsString('450', $data['@graph'][0]['priceRange']);
    }

    public function test_a_new_trainer_has_no_rating_in_the_json_ld()
    {
        $this->get(route('trainers.show', 'elena-ricci'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('seo.index', true)
                ->missing('seo.jsonLd.0.aggregateRating')
            );
    }

    public function test_paused_and_preview_profiles_are_not_indexed()
    {
        $profile = TrainerProfile::where('slug', 'marco-bianchi')->firstOrFail();
        $profile->forceFill(['paused_at' => now()])->save();

        // Still reachable with the link, but not for search engines.
        $this->get(route('trainers.show', 'marco-bianchi'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('seo.index', false));

        // A profile waiting for the team, seen by its trainer.
        $waiting = TrainerProfile::where('slug', 'marco-ferri')->firstOrFail();

        $this->actingAs($waiting->user)
            ->get(route('trainers.show', 'marco-ferri'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('preview', true)->where('seo.index', false));
    }

    public function test_the_trainer_registration_is_indexed_for_guests_only()
    {
        $this->get(route('trainer.register'))
            ->assertInertia(fn (Assert $page) => $page->where('seo.index', true));

        $this->actingAs(User::factory()->create())
            ->get(route('trainer.register'))
            ->assertInertia(fn (Assert $page) => $page->where('seo.index', false));
    }

    public function test_legal_pages_and_contacts_have_a_description()
    {
        foreach (['legal.privacy', 'legal.terms', 'legal.cookies', 'contact.show'] as $name) {
            $this->get(route($name))
                ->assertOk()
                ->assertInertia(fn (Assert $page) => $page->where('seo.index', true)->whereType('seo.description', 'string'))
                ->assertSee('<link rel="canonical" href="'.route($name).'">', false);
        }
    }

    public function test_pages_without_seo_are_not_indexed()
    {
        $this->get(route('login'))
            ->assertOk()
            ->assertSee('<meta name="robots" content="noindex, follow">', false)
            ->assertDontSee('name="description"', false);
    }
}
