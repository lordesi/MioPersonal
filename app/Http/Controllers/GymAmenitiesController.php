<?php

namespace App\Http\Controllers;

use App\Enums\GymAmenity;
use App\Http\Controllers\Concerns\BuildsGymArea;
use App\Models\GymAmenityDetail;
use App\Models\GymPhoto;
use App\Models\GymProfile;
use App\Support\SafeImage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Servizi" of the gym area: for each service ticked in the profile, a
 * description and a photo (e.g. the Turkish bath), on the public profile.
 * Each card is saved on its own and is public at once, like "Foto".
 */
class GymAmenitiesController extends Controller
{
    use BuildsGymArea;

    public function show(): Response
    {
        $profile = $this->gymOrFail();
        $details = $profile->amenityDetails()->get()->keyBy(fn (GymAmenityDetail $detail) => $detail->amenity->value);

        return Inertia::render('gym/amenities', [
            'gymArea' => $this->gymArea(),
            // In the order of the catalog, as on the profile.
            'amenities' => array_map(function (GymAmenity $amenity) use ($details) {
                /** @var GymAmenityDetail|null $detail */
                $detail = $details->get($amenity->value);

                return [
                    'value' => $amenity->value,
                    'label' => $amenity->label(),
                    'description' => $detail->description ?? '',
                    'photoUrl' => $detail?->photoUrl(),
                ];
            }, self::ticked($profile)),
            'descriptionMax' => GymAmenityDetail::DESCRIPTION_MAX,
        ]);
    }

    /** "Salva": the description, and a new photo if one is chosen (it replaces the old one). */
    public function update(Request $request, GymAmenity $amenity): RedirectResponse
    {
        $profile = $this->tickedOrFail($amenity);

        $data = $request->validate([
            'description' => ['nullable', 'string', 'max:'.GymAmenityDetail::DESCRIPTION_MAX],
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png', 'max:5120', 'dimensions:min_width=800,min_height=500'],
        ], [
            'description.max' => 'La descrizione può avere al massimo '.GymAmenityDetail::DESCRIPTION_MAX.' caratteri.',
            'photo.image' => 'La foto deve essere un’immagine JPG o PNG.',
            'photo.mimes' => 'La foto deve essere un’immagine JPG o PNG.',
            'photo.max' => 'La foto può pesare al massimo 5 MB.',
            'photo.dimensions' => 'La foto deve essere almeno 800 × 500 px.',
            'photo.uploaded' => 'Non siamo riusciti a caricare la foto: riprova.',
        ]);

        $detail = $profile->amenityDetails()->firstOrNew(['amenity' => $amenity]);
        $oldPhoto = null;
        $file = $request->file('photo');

        if ($file instanceof UploadedFile) {
            $oldPhoto = $detail->photo_path;
            $detail->photo_path = SafeImage::store($file, "gyms/{$profile->id}/amenities", GymPhoto::DISK);
        }

        $detail->description = filled($data['description'] ?? null) ? trim((string) $data['description']) : null;

        try {
            $this->saveOrDrop($detail);
        } catch (\Throwable $exception) {
            if ($file instanceof UploadedFile && $detail->photo_path !== null) {
                Storage::disk(GymPhoto::DISK)->delete($detail->photo_path);
            }

            throw $exception;
        }

        if ($oldPhoto !== null) {
            Storage::disk(GymPhoto::DISK)->delete($oldPhoto);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => "{$amenity->label()}: salvato."]);

        return back();
    }

    /** "Togli la foto": the description stays. */
    public function destroyPhoto(GymAmenity $amenity): RedirectResponse
    {
        $profile = $this->tickedOrFail($amenity);
        $detail = $profile->amenityDetails()->where('amenity', $amenity)->first();

        if ($detail?->photo_path !== null) {
            $path = $detail->photo_path;
            $detail->photo_path = null;
            $this->saveOrDrop($detail);
            Storage::disk(GymPhoto::DISK)->delete($path);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Foto eliminata.']);

        return back();
    }

    /** Without text and photo the row has nothing to say: it goes. */
    private function saveOrDrop(GymAmenityDetail $detail): void
    {
        if (! $detail->isEmpty()) {
            $detail->save();
        } elseif ($detail->exists) {
            $detail->delete();
        }
    }

    /** Only a service ticked in the profile: as if the others didn't exist. */
    private function tickedOrFail(GymAmenity $amenity): GymProfile
    {
        $profile = $this->gymOrFail();

        abort_unless(in_array($amenity, self::ticked($profile), true), 404);

        return $profile;
    }

    /**
     * The services ticked in the profile, in the order of the catalog.
     *
     * @return list<GymAmenity>
     */
    private static function ticked(GymProfile $profile): array
    {
        return array_values(array_filter(GymAmenity::cases(), fn (GymAmenity $amenity) => in_array($amenity->value, $profile->amenities, true)));
    }
}
