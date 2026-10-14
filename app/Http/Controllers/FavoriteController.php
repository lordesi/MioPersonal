<?php

namespace App\Http\Controllers;

use App\Models\TrainerProfile;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * The heart on the search cards, on the profile and in "Preferiti".
 * Saving twice or removing a trainer not saved does nothing.
 */
class FavoriteController extends Controller
{
    /** Only profiles the client can find: approved ones. */
    public function store(Request $request, string $slug): RedirectResponse
    {
        $profile = TrainerProfile::where('slug', $slug)->first();

        abort_if($profile === null || ! $profile->isApproved(), 404);

        $favorites = $this->client($request)->favoriteTrainers();

        if (! $favorites->whereKey($profile->id)->exists()) {
            $favorites->attach($profile->id, ['created_at' => now()]);
        }

        return back();
    }

    public function destroy(Request $request, string $slug): RedirectResponse
    {
        $profile = TrainerProfile::where('slug', $slug)->firstOrFail();

        $this->client($request)->favoriteTrainers()->detach($profile->id);

        return back();
    }

    private function client(Request $request): User
    {
        /** @var User $client */
        $client = $request->user();

        return $client;
    }
}
