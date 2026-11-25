<?php

namespace App\Http\Controllers;

use App\Models\GroupSession;
use App\Models\GymProfile;
use App\Models\TrainerProfile;
use App\Support\Features;
use App\Support\GroupSessionCard;
use App\Support\GymCard;
use App\Support\GymShelves;
use App\Support\HowItWorks;
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
    /** "Trainer in evidenza": a row of 4 on desktop, all of them in the row that scrolls on phones. */
    private const FEATURED = 9;

    /** "Palestre in evidenza": the same. */
    private const FEATURED_GYMS = 9;

    /** "Prossimi eventi": one row of 4. */
    private const EVENTS = 4;

    public function __invoke(Request $request): Response
    {
        TrainerSlots::refreshStale();

        $trainerFavorites = TrainerCard::favoriteIds($request->user());
        $trendingTrainers = TrainerShelves::trending($trainerFavorites);

        return Inertia::render('public/home', [
            // "Trainer in tendenza", or "in evidenza" while too few are trending.
            'trainers' => $trendingTrainers !== null
                ? ['key' => 'trending', 'title' => 'Trainer in tendenza', 'items' => $trendingTrainers]
                : ['key' => 'featured', 'title' => 'Trainer in evidenza', 'items' => $this->featuredTrainers($trainerFavorites)],
            // The same for the gyms (an empty shelf is hidden: gyms switched off).
            'gyms' => $this->gyms($request),
            // "Prossimi eventi" of all of Italy.
            'events' => Features::events()
                ? GroupSessionCard::many(GroupSessionCard::load(GroupSession::query()->listed()->upcoming())->orderBy('starts_at')->limit(self::EVENTS)->get())
                : [],
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
     * "Palestre in tendenza", or "in evidenza" while too few are trending;
     * no gyms while they are switched off.
     *
     * @return array{key: string, title: string, items: list<array<string, mixed>>}
     */
    private function gyms(Request $request): array
    {
        if (! Features::gyms()) {
            return ['key' => 'featured', 'title' => 'Palestre in evidenza', 'items' => []];
        }

        $gymFavorites = GymCard::favoriteIds($request->user());
        $trendingGyms = GymShelves::trending($gymFavorites);

        return $trendingGyms !== null
            ? ['key' => 'trending', 'title' => 'Palestre in tendenza', 'items' => $trendingGyms]
            : ['key' => 'featured', 'title' => 'Palestre in evidenza', 'items' => GymCard::many($this->featuredGyms(), $gymFavorites)];
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
