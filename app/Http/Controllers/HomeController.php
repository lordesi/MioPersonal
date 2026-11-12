<?php

namespace App\Http\Controllers;

use App\Enums\GroupSessionType;
use App\Enums\GymAmenity;
use App\Models\GroupSession;
use App\Models\GymCourse;
use App\Models\GymProfile;
use App\Models\TrainerProfile;
use App\Support\CatalogOptions;
use App\Support\CourseCard;
use App\Support\GroupSessionCard;
use App\Support\GymCard;
use App\Support\GymShelves;
use App\Support\HowItWorks;
use App\Support\NewsFeed;
use App\Support\Seo;
use App\Support\TrainerCard;
use App\Support\TrainerShelves;
use App\Support\TrainerSlots;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    /** "Trainer in evidenza": 3 per page of the carousel, 3 pages. */
    private const FEATURED = 9;

    /** "Palestre in evidenza": the same carousel, 3 per page, 3 pages. */
    private const FEATURED_GYMS = 9;

    /** "Corsi in palestra": the same carousel. */
    private const FEATURED_COURSES = 9;

    /** "Prossimi eventi". */
    private const EVENTS = 6;

    public function __invoke(Request $request): Response
    {
        TrainerSlots::refreshStale();

        $trainerFavorites = TrainerCard::favoriteIds($request->user());
        $gymFavorites = GymCard::favoriteIds($request->user());
        $trendingTrainers = TrainerShelves::trending($trainerFavorites);
        $trendingGyms = GymShelves::trending($gymFavorites);

        return Inertia::render('public/home', [
            // "Trainer in tendenza", or "in evidenza" while too few are trending.
            'trainers' => $trendingTrainers !== null
                ? ['key' => 'trending', 'title' => 'Trainer in tendenza', 'items' => $trendingTrainers]
                : ['key' => 'featured', 'title' => 'Trainer in evidenza', 'items' => $this->featuredTrainers($trainerFavorites)],
            // The same for the gyms.
            'gyms' => $trendingGyms !== null
                ? ['key' => 'trending', 'title' => 'Palestre in tendenza', 'items' => $trendingGyms]
                : ['key' => 'featured', 'title' => 'Palestre in evidenza', 'items' => GymCard::many($this->featuredGyms(), $gymFavorites)],
            // "Corsi in palestra".
            'featuredCourses' => $this->featuredCourses(),
            // "Prossimi eventi" of all of Italy.
            'events' => GroupSessionCard::many(GroupSessionCard::load(GroupSession::query()->listed()->upcoming())->orderBy('starts_at')->limit(self::EVENTS)->get()),
            // "Novità": the newest trainers, gyms and events of all of Italy.
            'news' => NewsFeed::preview(null, $request->user()),
            // Options of the search form.
            'disciplines' => CatalogOptions::disciplines(),
            // With the center of each city: "Usa la mia posizione" finds the closest one in the browser.
            'cities' => CatalogOptions::citiesWithCoordinates(),
            // "Servizi" of the gyms' search ("Trainer | Palestre").
            'amenities' => GymAmenity::options(),
            // "Tipo" of the events' search.
            'eventTypes' => GroupSessionType::options(),
            'seo' => $this->seo(),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function seo(): array
    {
        $home = route('home');

        return Seo::page(
            title: 'Trova il tuo personal trainer',
            description: 'Cerca personal trainer verificati nella tua città o online: confronta discipline, prezzi e recensioni e prenota la prima seduta in pochi clic. Gratis.',
            canonical: $home,
            jsonLd: [
                array_filter([
                    '@type' => 'Organization',
                    '@id' => $home.'#organization',
                    'name' => config('app.name'),
                    'url' => $home,
                    'logo' => asset('miopersonal-logo.jpg'),
                    // What an AI assistant reads when asked "cos'è MioPersonal?".
                    'description' => HowItWorks::SUMMARY,
                    'areaServed' => ['@type' => 'Country', 'name' => 'Italia'],
                    'contactPoint' => [
                        '@type' => 'ContactPoint',
                        'contactType' => 'customer support',
                        'email' => config('mail.contact_address'),
                        'url' => route('contact.show'),
                        'availableLanguage' => 'Italian',
                    ],
                    // The brand's social profiles (APP_SAME_AS): the same company everywhere.
                    'sameAs' => config('app.same_as') ?: null,
                ]),
                [
                    '@type' => 'WebSite',
                    'name' => config('app.name'),
                    'url' => $home,
                    'inLanguage' => 'it-IT',
                    'publisher' => ['@id' => $home.'#organization'],
                    // The search box of the 404 page reads ?q= the same way.
                    'potentialAction' => [
                        '@type' => 'SearchAction',
                        'target' => route('trainers.search').'?q={search_term_string}',
                        'query-input' => 'required name=search_term_string',
                    ],
                ],
            ],
        );
    }

    /**
     * "Corsi in palestra": active courses with lessons of the published gyms,
     * the newest first.
     *
     * @return list<array<string, mixed>>
     */
    private function featuredCourses(): array
    {
        return CourseCard::many(GymCourse::query()
            ->where('is_active', true)
            ->whereHas('lessons')
            ->whereHas('gymProfile', fn ($gym) => $gym->published())
            ->with(CourseCard::RELATIONS)
            ->latest('id')
            ->limit(self::FEATURED_COURSES)
            ->get());
    }

    /**
     * "Palestre in evidenza": published gyms with a cover photo, the ones
     * with a promotion running first, then the ones with more trainers.
     *
     * @return Collection<int, GymProfile>
     */
    private function featuredGyms(): Collection
    {
        return GymProfile::query()
            ->published()
            ->whereHas('cover')
            ->with(GymCard::RELATIONS)
            ->withCount(['trainers', 'activePromotions'])
            ->orderByDesc('active_promotions_count')
            ->orderByDesc('trainers_count')
            ->latest('approved_at')
            ->limit(self::FEATURED_GYMS)
            ->get();
    }

    /**
     * "Trainer in evidenza": the best rated among the published profiles
     * (never the ones still waiting for the team), then the newest.
     *
     * @param  list<int>  $favoriteIds  The heart is full for the trainers the client saved.
     * @return list<array<string, mixed>>
     */
    private function featuredTrainers(array $favoriteIds): array
    {
        $profiles = TrainerProfile::query()
            ->published()
            ->with(TrainerCard::RELATIONS)
            ->orderByRaw('case when rating_count = 0 then 0 else rating_sum * 1.0 / rating_count end desc')
            ->orderByDesc('rating_count')
            ->latest('approved_at')
            ->limit(self::FEATURED)
            ->get();

        return array_values($profiles->map(fn (TrainerProfile $profile) => [
            ...TrainerCard::from($profile),
            'favorite' => in_array($profile->id, $favoriteIds, true),
        ])->all());
    }
}
