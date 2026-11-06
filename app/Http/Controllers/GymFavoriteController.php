<?php

namespace App\Http\Controllers;

use App\Models\GymProfile;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * The heart on the gym cards, on the gym profile and in "Preferiti".
 * Saving twice or removing a gym not saved does nothing.
 */
class GymFavoriteController extends Controller
{
    /** Only gyms the client can find: approved, with the owner active. */
    public function store(Request $request, string $slug): RedirectResponse
    {
        $gym = GymProfile::query()->approved()->where('slug', $slug)->first();

        abort_if($gym === null, 404);

        $favorites = $this->client($request)->favoriteGyms();

        if (! $favorites->whereKey($gym->id)->exists()) {
            $favorites->attach($gym->id, ['created_at' => now()]);
        }

        return back();
    }

    public function destroy(Request $request, string $slug): RedirectResponse
    {
        $gym = GymProfile::where('slug', $slug)->firstOrFail();

        $this->client($request)->favoriteGyms()->detach($gym->id);

        return back();
    }

    private function client(Request $request): User
    {
        /** @var User $client */
        $client = $request->user();

        return $client;
    }
}
