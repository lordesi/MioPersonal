<?php

namespace App\Actions\Gym;

use App\Enums\TrainerProfileStatus;
use App\Models\City;
use App\Models\GymPhoto;
use App\Models\GymProfile;
use App\Models\User;
use App\Support\SafeImage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Saves "Registra la tua palestra" (handle: the profile goes, back, to "In
 * revisione") and "Modifica profilo" of the gym area (update: public right
 * away, no new review, like the trainers). The hours are replaced; a new
 * cover replaces the old one; gallery photos sent with the registration are
 * added at the end.
 */
class SaveGymProfile
{
    /**
     * @param  array<string, mixed>  $data  validated by GymProfileRequest
     */
    public function handle(User $user, array $data): GymProfile
    {
        return $this->withFileCleanup(function (array &$newFiles) use ($user, $data) {
            $profile = $user->gymProfile ?? new GymProfile;
            $profile->user_id = $user->id;

            $this->fillDetails($profile, $data);
            $profile->slug ??= GymProfile::uniqueSlug($profile->name, $profile->city->name);
            $profile->forceFill([
                'status' => TrainerProfileStatus::Review,
                'status_changed_at' => now(),
            ])->save();

            $this->saveHours($profile, $data['hours'] ?? []);
            $newFiles = [...$newFiles, ...$this->saveCover($profile, $data['cover'] ?? null)];
            $newFiles = [...$newFiles, ...$this->addGallery($profile, $data['gallery'] ?? [])];

            $user->setRelation('gymProfile', $profile);

            return $profile;
        });
    }

    /**
     * "Modifica profilo": everything but the status.
     *
     * @param  array<string, mixed>  $data  validated by GymProfileRequest
     */
    public function update(GymProfile $profile, array $data): GymProfile
    {
        $oldPhotos = [];

        $profile = $this->withFileCleanup(function (array &$newFiles) use ($profile, $data, &$oldPhotos) {
            $this->fillDetails($profile, $data);
            $profile->save();

            $this->saveHours($profile, $data['hours'] ?? []);
            $newFiles = [...$newFiles, ...$this->saveCover($profile, $data['cover'] ?? null)];
            $oldPhotos = $this->dropUntickedAmenityDetails($profile);

            return $profile;
        });

        // Only once the change is saved.
        Storage::disk(GymPhoto::DISK)->delete($oldPhotos);

        return $profile;
    }

    /**
     * A service taken off the profile takes its description and photo
     * with it ("Servizi" of the gym area). The photos to delete are returned.
     *
     * @return list<string>
     */
    private function dropUntickedAmenityDetails(GymProfile $profile): array
    {
        $untickedDetails = $profile->amenityDetails()->whereNotIn('amenity', $profile->amenities);
        $photos = (clone $untickedDetails)->whereNotNull('photo_path')->pluck('photo_path')->all();

        $untickedDetails->delete();

        return array_values(array_filter($photos, 'is_string'));
    }

    /**
     * Runs $save in a transaction. Files written before a failed transaction
     * are removed at the end.
     *
     * @param  \Closure(list<array{string, string}>&): GymProfile  $save
     */
    private function withFileCleanup(\Closure $save): GymProfile
    {
        $newFiles = [];

        try {
            return DB::transaction(function () use ($save, &$newFiles) {
                return $save($newFiles);
            });
        } catch (\Throwable $exception) {
            foreach ($newFiles as [$disk, $path]) {
                Storage::disk($disk)->delete($path);
            }

            throw $exception;
        }
    }

    /** @param  array<string, mixed>  $data */
    private function fillDetails(GymProfile $profile, array $data): void
    {
        $city = City::where('slug', $data['city'])->firstOrFail();

        $profile->fill([
            'name' => trim($data['name']),
            'description' => trim($data['description']),
            'city_id' => $city->id,
            'address' => trim($data['address']),
            'postal_code' => filled($data['postal_code'] ?? null) ? trim($data['postal_code']) : null,
            'amenities' => array_values(array_unique($data['amenities'])),
            'opening_notes' => filled($data['opening_notes'] ?? null) ? trim($data['opening_notes']) : null,
            'phone' => filled($data['contact_phone'] ?? null) ? trim($data['contact_phone']) : null,
            'email' => $data['contact_email'] ?? null,
            'website' => $data['website'] ?? null,
            'instagram' => $data['instagram'] ?? null,
        ]);
        $profile->setRelation('city', $city);
    }

    /**
     * hours[0..6] (0 = Monday) → weekday 1..7. "24:00" is saved as 23:59.
     *
     * @param  array<int|string, list<array{opens: string, closes: string}>>  $hours
     */
    private function saveHours(GymProfile $profile, array $hours): void
    {
        $profile->openingHours()->delete();

        foreach ($hours as $day => $ranges) {
            foreach ($ranges as $range) {
                $profile->openingHours()->create([
                    'weekday' => (int) $day + 1,
                    'opens_at' => $range['opens'],
                    'closes_at' => $range['closes'] === '24:00' ? '23:59' : $range['closes'],
                ]);
            }
        }
    }

    /**
     * A new cover replaces the old one; without one, the old one stays.
     *
     * @return list<array{string, string}> the files written: [disk, path]
     */
    private function saveCover(GymProfile $profile, ?UploadedFile $cover): array
    {
        if ($cover === null) {
            return [];
        }

        $old = $profile->cover;
        // Without metadata (GPS position…): see SafeImage.
        $path = SafeImage::store($cover, "gyms/{$profile->id}", GymPhoto::DISK);

        $profile->photos()->create(['path' => $path, 'is_cover' => true]);

        if ($old !== null) {
            $old->delete();
            DB::afterCommit(fn () => Storage::disk(GymPhoto::DISK)->delete($old->path));
        }

        $profile->unsetRelation('cover');

        return [[GymPhoto::DISK, $path]];
    }

    /**
     * @param  list<UploadedFile>  $files
     * @return list<array{string, string}> the files written: [disk, path]
     */
    private function addGallery(GymProfile $profile, array $files): array
    {
        $written = [];
        $sort = (int) $profile->galleryPhotos()->max('sort');
        $room = GymProfile::MAX_GALLERY_PHOTOS - $profile->galleryPhotos()->count();

        foreach (array_slice($files, 0, max(0, $room)) as $file) {
            $path = SafeImage::store($file, "gyms/{$profile->id}/gallery", GymPhoto::DISK);
            $written[] = [GymPhoto::DISK, $path];
            $sort += 10;
            $profile->photos()->create(['path' => $path, 'is_cover' => false, 'sort' => $sort]);
        }

        return $written;
    }
}
