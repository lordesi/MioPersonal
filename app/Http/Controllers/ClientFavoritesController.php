<?php

namespace App\Http\Controllers;

use App\Enums\TrainerProfileStatus;
use App\Models\GymProfile;
use App\Models\User;
use App\Support\GymCard;
use App\Support\TrainerCard;
use App\Support\TrainerSlots;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Preferiti": the trainers and the gyms the client saved with the heart,
 * last saved first, in two tabs (?tipo=palestre opens the second).
 */
class ClientFavoritesController extends Controller
{
    public function __invoke(Request $request): Response
    {
        /** @var User $client */
        $client = $request->user();

        TrainerSlots::refreshStale();

        // A profile the team takes back for review disappears from here too.
        $trainers = $client->favoriteTrainers()
            ->where('trainer_profiles.status', TrainerProfileStatus::Approved)
            ->with(TrainerCard::RELATIONS)
            ->get()
            ->map(TrainerCard::from(...))
            ->values()
            ->all();

        // A gym suspended, being deleted or taken back for review too.
        $gyms = $client->favoriteGyms()
            ->approved()
            ->with(GymCard::RELATIONS)
            ->withCount('trainers')
            ->get();

        $tab = match ($request->query('tipo')) {
            'palestre' => 'gyms',
            'trainer' => 'trainers',
            // The tab with something in it: the trainers when both have.
            default => $trainers === [] && $gyms->isNotEmpty() ? 'gyms' : 'trainers',
        };

        return Inertia::render('client/favorites', [
            'trainers' => $trainers,
            // All saved: the heart is full on each card.
            'gyms' => $gyms->map(fn (GymProfile $gym) => [...GymCard::from($gym), 'favorite' => true])->values()->all(),
            'tab' => $tab,
        ]);
    }
}
