<?php

namespace App\Http\Controllers;

use App\Actions\Gym\SaveGymProfile;
use App\Enums\GymAmenity;
use App\Http\Controllers\Concerns\BuildsGymArea;
use App\Http\Requests\GymProfileRequest;
use App\Models\GymProfile;
use App\Support\CatalogOptions;
use App\Support\GymDraft;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Modifica profilo" of the gym area: the registration fields, public right
 * away without a new review. Only an approved gym: before that, the
 * registration page is where the profile is fixed.
 */
class GymProfileEditController extends Controller
{
    use BuildsGymArea;

    public function show(): Response|RedirectResponse
    {
        $profile = $this->gym();

        if (! $profile?->isApproved()) {
            return to_route('gym.register');
        }

        return Inertia::render('gym/profile', [
            'gymArea' => $this->gymArea(),
            'draft' => GymDraft::fromProfile($profile),
            'cities' => CatalogOptions::cities(),
            'amenities' => GymAmenity::options(),
        ]);
    }

    public function update(GymProfileRequest $request, SaveGymProfile $saver): RedirectResponse
    {
        $profile = $this->gym();

        abort_unless($profile instanceof GymProfile && $profile->isApproved(), 403);

        $saver->update($profile, $request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Profilo aggiornato.']);

        return to_route('gym.profile.edit');
    }
}
