<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\BuildsAccountSettings;
use App\Http\Controllers\Concerns\BuildsGymArea;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Impostazioni account" of the gym: the account sections (saved by
 * AccountSettingsController), "Visibile nella ricerca" and "Elimina account".
 */
class GymSettingsController extends Controller
{
    use BuildsAccountSettings;
    use BuildsGymArea;

    public function show(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $profile = $user->gymProfile;

        return Inertia::render('gym/settings', [
            'gymArea' => $this->gymArea(),
            'account' => $this->accountSettings($user),
            'visibleInSearch' => $profile?->visible_in_search,
        ]);
    }

    public function updateVisibility(Request $request): RedirectResponse
    {
        $profile = $this->gymOrFail();
        $data = $request->validate(['visible_in_search' => ['required', 'boolean']]);

        $profile->update(['visible_in_search' => $data['visible_in_search']]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $profile->visible_in_search ? 'La palestra compare nella ricerca.' : 'La palestra non compare più nella ricerca.',
        ]);

        return back();
    }
}
