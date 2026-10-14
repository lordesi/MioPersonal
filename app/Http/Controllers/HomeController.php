<?php

namespace App\Http\Controllers;

use App\Models\TrainerProfile;
use App\Support\CatalogOptions;
use App\Support\TrainerCard;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    private const FEATURED = 3;

    public function __invoke(): Response
    {
        return Inertia::render('public/home', [
            'featuredTrainers' => $this->featuredTrainers(),
            // Options of the search form.
            'disciplines' => CatalogOptions::disciplines(),
            'cities' => CatalogOptions::cities(),
        ]);
    }

    /**
     * "Trainer in evidenza": the best rated among the published profiles
     * (never the ones still waiting for the team), then the newest.
     *
     * @return list<array<string, mixed>>
     */
    private function featuredTrainers(): array
    {
        $profiles = TrainerProfile::query()
            ->published()
            ->with(TrainerCard::RELATIONS)
            ->orderByRaw('case when rating_count = 0 then 0 else rating_sum * 1.0 / rating_count end desc')
            ->orderByDesc('rating_count')
            ->latest('approved_at')
            ->limit(self::FEATURED)
            ->get();

        return array_values($profiles->map(TrainerCard::from(...))->all());
    }
}
