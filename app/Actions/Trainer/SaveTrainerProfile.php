<?php

namespace App\Actions\Trainer;

use App\Enums\PlaceType;
use App\Enums\TrainerProfileStatus;
use App\Models\City;
use App\Models\Discipline;
use App\Models\TrainerDocument;
use App\Models\TrainerPhoto;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Support\TrainerAvailability;
use App\Support\TrainerSlots;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Saves steps 2–7 of "Diventa trainer", both the first time and when the
 * trainer sends the profile again after "Chiedi modifiche". The lists
 * (disciplines, places, services, hours, certifications) are replaced, then
 * the computed fields of the search are updated. The profile goes (back) to
 * "In revisione": it shows up in the site only after the team approves it.
 *
 * update() is "Modifica profilo" of an approved trainer: the same steps
 * without the services (step 4, changed from "Servizi") and the hours
 * (step 5), public right away, without a new review.
 */
class SaveTrainerProfile
{
    public function __construct(private SaveTrainerServices $services) {}

    /**
     * @param  array<string, mixed>  $data  validated by TrainerProfileRequest
     */
    public function handle(User $user, array $data): TrainerProfile
    {
        return $this->withFileCleanup(function (array &$newFiles) use ($user, $data) {
            $profile = $user->trainerProfile ?? new TrainerProfile;
            $profile->user_id = $user->id;
            $profile->slug ??= TrainerProfile::uniqueSlug($user->name);

            $profile->fill(TrainerAvailability::attributes($data));
            $profile->forceFill([
                'status' => TrainerProfileStatus::Review,
                'status_changed_at' => now(),
            ]);

            $this->saveDetails($profile, $data, $newFiles);
            $this->services->save($profile, $data);
            TrainerAvailability::saveHours($profile, $data['hours'] ?? []);

            TrainerSlots::refresh($profile->load('workingHours'));

            // The user may have read "no profile" before: now it has one.
            $user->setRelation('trainerProfile', $profile);

            return $profile;
        });
    }

    /**
     * "Modifica profilo": steps 2, 3 and 6. Status, services and hours don't change.
     *
     * @param  array<string, mixed>  $data  validated by TrainerProfileUpdateRequest
     */
    public function update(TrainerProfile $profile, array $data): TrainerProfile
    {
        return $this->withFileCleanup(function (array &$newFiles) use ($profile, $data) {
            $this->saveDetails($profile, $data, $newFiles);
            // Online or the places in person may be gone: their own online prices too.
            $this->services->dropOnlinePricesIfUnused($profile);

            return $profile;
        });
    }

    /**
     * Runs $save in a transaction. Files written before a failed transaction
     * are removed at the end.
     *
     * @param  \Closure(list<array{string, string}>&): TrainerProfile  $save
     */
    private function withFileCleanup(\Closure $save): TrainerProfile
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

    /**
     * Steps 2, 3 and 6: public profile, disciplines and places, photo and
     * certifications, plus where the trainer trains (read by the search).
     *
     * @param  array<string, mixed>  $data
     * @param  list<array{string, string}>  $newFiles  the files written: [disk, path]
     */
    private function saveDetails(TrainerProfile $profile, array $data, array &$newFiles): void
    {
        $citySlugs = [$data['city'] ?? null, ...$data['other_cities'] ?? []];
        $cityIds = City::whereIn('slug', array_filter($citySlugs))->pluck('id', 'slug');
        $places = array_map(PlaceType::from(...), array_values(array_unique($data['places'])));
        $inPerson = array_filter($places, fn (PlaceType $place) => $place !== PlaceType::Online) !== [];
        $mainCityId = $inPerson ? ($cityIds[$data['city'] ?? ''] ?? null) : null;

        $profile->fill([
            'headline' => trim($data['headline']),
            'bio' => trim($data['bio']),
            'experience' => $data['experience'],
            'goals' => array_values($data['goals']),
            'city_id' => $mainCityId,
        ]);
        $profile->forceFill([
            'trains_online' => in_array(PlaceType::Online, $places, true),
            'trains_in_person' => $inPerson,
            // A new profile: the durations come right after, with the services.
            'session_minutes' => $profile->session_minutes ?? [],
        ])->save();

        $this->saveDisciplines($profile, $data['disciplines']);

        // Online-only trainers go nowhere; the main city is not repeated.
        $otherCityIds = [];

        foreach ($inPerson ? $data['other_cities'] ?? [] : [] as $slug) {
            $id = $cityIds[$slug] ?? null;

            if ($id !== null && $id !== $mainCityId) {
                $otherCityIds[] = $id;
            }
        }

        $profile->otherCities()->sync($otherCityIds);

        $this->savePlaces($profile, $places, $data['studios'] ?? [], $mainCityId);
        $newFiles = [...$newFiles, ...$this->savePhoto($profile, $data['photo'] ?? null)];
        $newFiles = [...$newFiles, ...$this->saveCertifications($profile, $data['certifications'] ?? [])];
    }

    /** @param  list<string>  $slugs  in the trainer's order */
    private function saveDisciplines(TrainerProfile $profile, array $slugs): void
    {
        $ids = Discipline::whereIn('slug', $slugs)->pluck('id', 'slug');
        $sync = [];

        foreach ($slugs as $index => $slug) {
            $sync[$ids[$slug]] = ['sort' => $index];
        }

        $profile->disciplines()->sync($sync);
    }

    /**
     * One row per studio, then one for home, park and online.
     *
     * @param  list<PlaceType>  $places
     * @param  list<array{name: string, address: string}>  $studios
     */
    private function savePlaces(TrainerProfile $profile, array $places, array $studios, ?int $cityId): void
    {
        $profile->places()->delete();
        $rows = [];

        if (in_array(PlaceType::Studio, $places, true)) {
            foreach ($studios as $studio) {
                $rows[] = [
                    'type' => PlaceType::Studio,
                    'name' => trim($studio['name']),
                    'address' => trim($studio['address']),
                    'city_id' => $cityId,
                ];
            }
        }

        foreach ([PlaceType::Home, PlaceType::Park, PlaceType::Online] as $type) {
            if (in_array($type, $places, true)) {
                $rows[] = ['type' => $type, 'city_id' => $type === PlaceType::Online ? null : $cityId];
            }
        }

        foreach ($rows as $index => $row) {
            $profile->places()->create([...$row, 'sort' => $index]);
        }
    }

    /**
     * A new photo replaces the old one; without one, the old one stays.
     *
     * @return list<array{string, string}> the files written: [disk, path]
     */
    private function savePhoto(TrainerProfile $profile, ?UploadedFile $photo): array
    {
        if ($photo === null) {
            return [];
        }

        $old = $profile->portrait;
        $path = $photo->store("trainers/{$profile->id}", TrainerPhoto::DISK);

        if ($path === false) {
            throw new \RuntimeException('The profile photo could not be stored.');
        }

        $profile->photos()->create(['path' => $path, 'caption' => 'Ritratto', 'is_portrait' => true]);

        if ($old !== null) {
            $old->delete();
            DB::afterCommit(fn () => Storage::disk(TrainerPhoto::DISK)->delete($old->path));
        }

        return [[TrainerPhoto::DISK, $path]];
    }

    /**
     * The list replaces the old one. A certification sent again with its id
     * keeps its file, unless a new file replaces it or remove_file (the ✕
     * next to the certificate) takes it away.
     *
     * @param  list<array{id?: int|null, title: string, issuer?: string|null, year?: int|null, file?: UploadedFile|null, remove_file?: bool|int|string|null}>  $certifications
     * @return list<array{string, string}> the files written: [disk, path]
     */
    private function saveCertifications(TrainerProfile $profile, array $certifications): array
    {
        $old = $profile->documents()->where('type', 'certificate')->get()->keyBy('id');
        $written = [];
        $kept = [];

        foreach ($certifications as $index => $certification) {
            $previous = $old->get((int) ($certification['id'] ?? 0));
            $removeFile = (bool) ($certification['remove_file'] ?? false);
            $path = $removeFile ? null : $previous?->path;
            $file = $certification['file'] ?? null;

            if ($file !== null) {
                $stored = $file->store("trainers/{$profile->id}/certificates", TrainerDocument::DISK);

                if ($stored === false) {
                    throw new \RuntimeException('A certificate could not be stored.');
                }

                $written[] = [TrainerDocument::DISK, $stored];
                $path = $stored;
            } elseif ($previous !== null && ! $removeFile) {
                $kept[] = $previous->id;
            }

            $profile->documents()->create([
                'type' => 'certificate',
                'title' => trim($certification['title']),
                'issuer' => filled($certification['issuer'] ?? null) ? trim((string) $certification['issuer']) : null,
                'year' => $certification['year'] ?? null,
                'path' => $path,
                'sort' => $index,
            ]);
        }

        // The old rows go; their files too, unless a new row took them over.
        $keptPaths = $old->only($kept)->pluck('path')->filter()->all();
        $orphans = $old->pluck('path')->filter()->diff($keptPaths)->values()->all();
        $profile->documents()->whereKey($old->keys())->delete();
        DB::afterCommit(fn () => Storage::disk(TrainerDocument::DISK)->delete($orphans));

        return $written;
    }
}
