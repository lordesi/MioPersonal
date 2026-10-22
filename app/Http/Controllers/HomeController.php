<?php

namespace App\Http\Controllers;

use App\Models\TrainerProfile;
use App\Support\CatalogOptions;
use App\Support\TrainerCard;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    /** "Trainer in evidenza": 3 per page of the carousel, 3 pages. */
    private const FEATURED = 9;

    public function __invoke(Request $request): Response
    {
        return Inertia::render('public/home', [
            'featuredTrainers' => $this->featuredTrainers(TrainerCard::favoriteIds($request->user())),
            // Options of the search form.
            'disciplines' => CatalogOptions::disciplines(),
            'cities' => CatalogOptions::cities(),
        ]);
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
