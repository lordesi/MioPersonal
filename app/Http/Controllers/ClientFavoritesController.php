<?php

namespace App\Http\Controllers;

use App\Enums\TrainerProfileStatus;
use App\Models\User;
use App\Support\TrainerCard;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/** "Preferiti": the trainers the client saved with the heart, last saved first. */
class ClientFavoritesController extends Controller
{
    public function __invoke(Request $request): Response
    {
        /** @var User $client */
        $client = $request->user();

        return Inertia::render('client/favorites', [
            // A profile the team takes back for review disappears from here too.
            'trainers' => $client->favoriteTrainers()
                ->where('trainer_profiles.status', TrainerProfileStatus::Approved)
                ->with(TrainerCard::RELATIONS)
                ->get()
                ->map(TrainerCard::from(...))
                ->values()
                ->all(),
        ]);
    }
}
