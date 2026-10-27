<?php

namespace App\Http\Controllers;

use App\Actions\Trainer\SaveTrainerProfile;
use App\Http\Controllers\Concerns\BuildsPlaceholderData;
use App\Http\Requests\TrainerProfileUpdateRequest;
use App\Models\TrainerPhoto;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Support\CatalogOptions;
use App\Support\TrainerDraft;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Modifica profilo": an approved trainer changes photo, presentation,
 * disciplines and places and certifications (steps 2, 3 and 6 of "Diventa
 * trainer"; the services are changed from "Servizi"). Saved changes are
 * public right away, without a new review, like "Disponibilità". Before the
 * approval the page shows the profile, locked: nothing can be saved.
 */
class TrainerProfileEditController extends Controller
{
    use BuildsPlaceholderData;

    public function show(Request $request): Response
    {
        $profile = $this->profile($request);

        return Inertia::render('trainer/profile', [
            'trainerArea' => $this->trainerArea(),
            // null: the registration is not sent yet, the page links to "Diventa trainer".
            'draft' => $profile ? TrainerDraft::fromProfile($profile) : null,
            // False until the team approves the profile: shown, but locked.
            'editable' => $profile?->isApproved() ?? false,
            'disciplines' => $profile ? CatalogOptions::disciplines() : [],
            'cities' => $profile ? CatalogOptions::cities() : [],
            // "Foto della galleria": saved one action at a time by TrainerPhotoController.
            'gallery' => $profile
                ? $profile->galleryPhotos->map(fn (TrainerPhoto $photo) => ['id' => $photo->id, 'url' => $photo->url()])->values()->all()
                : [],
            'maxGalleryPhotos' => TrainerProfile::MAX_GALLERY_PHOTOS,
            // "Nuovo" or the stars in "Così ti vedono nella ricerca".
            'rating' => $profile
                ? ['value' => $profile->rating(), 'count' => $profile->rating_count]
                : null,
        ]);
    }

    public function update(TrainerProfileUpdateRequest $request, SaveTrainerProfile $saver): RedirectResponse
    {
        $profile = $this->profile($request);

        abort_unless($profile?->isApproved() ?? false, 403);

        $saver->update($profile, $request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Profilo aggiornato.']);

        return back();
    }

    private function profile(Request $request): ?TrainerProfile
    {
        /** @var User $user */
        $user = $request->user();

        return $user->trainerProfile;
    }
}
