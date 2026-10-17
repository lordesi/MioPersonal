<?php

namespace App\Http\Controllers;

use App\Models\TrainerPhoto;
use App\Models\TrainerProfile;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

/**
 * "Foto della galleria" in "Modifica profilo": the photos of the carousel
 * after the profile photo. Each action is saved right away and is public at
 * once, like the rest of "Modifica profilo". The profile photo itself is
 * changed from the profile form (SaveTrainerProfile::savePhoto).
 */
class TrainerPhotoController extends Controller
{
    /** "Aggiungi foto": one or more files, added at the end. */
    public function store(Request $request): RedirectResponse
    {
        $profile = $this->approvedProfile($request);
        $room = max(0, TrainerProfile::MAX_GALLERY_PHOTOS - $profile->galleryPhotos()->count());

        $request->validate([
            'photos' => ['required', 'array', 'min:1', 'max:'.$room],
            'photos.*' => ['required', 'image', 'mimes:jpg,jpeg,png', 'max:5120', 'dimensions:min_width=800,min_height=500'],
        ], [
            'photos.required' => 'Scegli almeno una foto.',
            'photos.max' => $room === 0
                ? 'Hai già '.TrainerProfile::MAX_GALLERY_PHOTOS.' foto: eliminane una per aggiungerne altre.'
                : "Puoi aggiungere ancora {$room} foto.",
            'photos.*.image' => 'Le foto devono essere immagini JPG o PNG.',
            'photos.*.mimes' => 'Le foto devono essere immagini JPG o PNG.',
            'photos.*.max' => 'Ogni foto può pesare al massimo 5 MB.',
            'photos.*.dimensions' => 'Ogni foto deve essere almeno 800 × 500 px.',
            'photos.*.uploaded' => 'Non siamo riusciti a caricare una foto: riprova.',
        ]);

        /** @var list<UploadedFile> $files */
        $files = $request->file('photos');
        $written = [];

        try {
            DB::transaction(function () use ($profile, $files, &$written) {
                // After the last one: 10, 20, 30…
                $sort = (int) $profile->galleryPhotos()->max('sort');

                foreach ($files as $file) {
                    // A random name, so the address can't be guessed.
                    $path = $file->store("trainers/{$profile->id}/gallery", TrainerPhoto::DISK);

                    if ($path === false) {
                        throw new \RuntimeException('A gallery photo could not be stored.');
                    }

                    $written[] = $path;
                    $sort += 10;
                    $profile->photos()->create(['path' => $path, 'is_portrait' => false, 'sort' => $sort]);
                }
            });
        } catch (\Throwable $exception) {
            // Files written before the failure are removed.
            Storage::disk(TrainerPhoto::DISK)->delete($written);

            throw $exception;
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => count($files) === 1 ? 'Foto aggiunta.' : 'Foto aggiunte.',
        ]);

        return back();
    }

    public function destroy(Request $request, TrainerPhoto $photo): RedirectResponse
    {
        $this->galleryPhotoOf($this->approvedProfile($request), $photo);

        $photo->delete();
        Storage::disk(TrainerPhoto::DISK)->delete($photo->path);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Foto eliminata.']);

        return back();
    }

    /** Like "Modifica profilo": only an approved profile. */
    private function approvedProfile(Request $request): TrainerProfile
    {
        /** @var User $user */
        $user = $request->user();
        $profile = $user->trainerProfile;

        abort_unless($profile?->isApproved() ?? false, 403);

        return $profile;
    }

    /** Someone else's photo, or the profile photo: as if it didn't exist. */
    private function galleryPhotoOf(TrainerProfile $profile, TrainerPhoto $photo): void
    {
        abort_if($photo->trainer_profile_id !== $profile->id || $photo->is_portrait, 404);
    }
}
