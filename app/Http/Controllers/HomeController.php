<?php

namespace App\Http\Controllers;

use App\Enums\GymAmenity;
use App\Models\GymProfile;
use App\Models\TrainerProfile;
use App\Support\CatalogOptions;
use App\Support\GymCard;
use App\Support\Seo;
use App\Support\TrainerCard;
use App\Support\TrainerSlots;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    /** "Trainer in evidenza": 3 per page of the carousel, 3 pages. */
    private const FEATURED = 9;

    /** "Palestre in evidenza": one row. */
    private const FEATURED_GYMS = 4;

    public function __invoke(Request $request): Response
    {
        TrainerSlots::refreshStale();

        return Inertia::render('public/home', [
            'featuredTrainers' => $this->featuredTrainers(TrainerCard::favoriteIds($request->user())),
            'featuredGyms' => GymCard::many($this->featuredGyms(), GymCard::favoriteIds($request->user())),
            // Options of the search form.
            'disciplines' => CatalogOptions::disciplines(),
            // With the center of each city: "Usa la mia posizione" finds the closest one in the browser.
            'cities' => CatalogOptions::citiesWithCoordinates(),
            // "Servizi" of the gyms' search ("Trainer | Palestre").
            'amenities' => GymAmenity::options(),
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
                [
                    '@type' => 'Organization',
                    '@id' => $home.'#organization',
                    'name' => config('app.name'),
                    'url' => $home,
                    'logo' => asset('miopersonal-logo.jpg'),
                ],
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
