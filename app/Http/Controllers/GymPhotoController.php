<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\BuildsGymArea;
use App\Models\GymPhoto;
use App\Models\GymProfile;
use App\Support\SafeImage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Foto" of the gym area: the cover and the gallery. Each action is saved
 * right away and is public at once.
 */
class GymPhotoController extends Controller
{
    use BuildsGymArea;

    public function show(): Response
    {
        $profile = $this->gymOrFail();

        return Inertia::render('gym/photos', [
            'gymArea' => $this->gymArea(),
            'cover' => $profile->cover?->url(),
            'photos' => $profile->galleryPhotos->map(fn (GymPhoto $photo) => [
                'id' => $photo->id,
                'url' => $photo->url(),
            ])->values(),
            'max' => GymProfile::MAX_GALLERY_PHOTOS,
        ]);
    }

    /** "Aggiungi foto": one or more files, added at the end. */
    public function store(Request $request): RedirectResponse
    {
        $profile = $this->gymOrFail();
        $room = max(0, GymProfile::MAX_GALLERY_PHOTOS - $profile->galleryPhotos()->count());

        $request->validate([
            'photos' => ['required', 'array', 'min:1', 'max:'.$room],
            'photos.*' => ['required', 'image', 'mimes:jpg,jpeg,png', 'max:5120', 'dimensions:min_width=800,min_height=500'],
        ], [
            'photos.required' => 'Scegli almeno una foto.',
            'photos.max' => $room === 0
                ? 'Hai già '.GymProfile::MAX_GALLERY_PHOTOS.' foto: eliminane una per aggiungerne altre.'
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
                $sort = (int) $profile->galleryPhotos()->max('sort');

                foreach ($files as $file) {
                    $path = SafeImage::store($file, "gyms/{$profile->id}/gallery", GymPhoto::DISK);
                    $written[] = $path;
                    $sort += 10;
                    $profile->photos()->create(['path' => $path, 'is_cover' => false, 'sort' => $sort]);
                }
            });
        } catch (\Throwable $exception) {
            Storage::disk(GymPhoto::DISK)->delete($written);

            throw $exception;
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => count($files) === 1 ? 'Foto aggiunta.' : 'Foto aggiunte.',
        ]);

        return back();
    }

    /** "Usa come copertina": the old cover goes back to the gallery, at the start. */
    public function cover(GymPhoto $photo): RedirectResponse
    {
        $profile = $this->gymOrFail();
        $this->galleryPhotoOf($profile, $photo);

        DB::transaction(function () use ($profile, $photo) {
            $profile->photos()->where('is_cover', true)->update([
                'is_cover' => false,
                'sort' => ((int) $profile->galleryPhotos()->min('sort')) - 10,
            ]);
            $photo->forceFill(['is_cover' => true])->save();
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Copertina cambiata.']);

        return back();
    }

    public function destroy(GymPhoto $photo): RedirectResponse
    {
        $profile = $this->gymOrFail();
        $this->galleryPhotoOf($profile, $photo);

        $photo->delete();
        Storage::disk(GymPhoto::DISK)->delete($photo->path);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Foto eliminata.']);

        return back();
    }

    /** Someone else's photo, or the cover (it can only be replaced): as if it didn't exist. */
    private function galleryPhotoOf(GymProfile $profile, GymPhoto $photo): void
    {
        abort_if($photo->gym_profile_id !== $profile->id || $photo->is_cover, 404);
    }
}
