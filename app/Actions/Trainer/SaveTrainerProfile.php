<?php

namespace App\Actions\Trainer;

use App\Enums\PlaceType;
use App\Enums\TrainerProfileStatus;
use App\Http\Requests\TrainerProfileRequest;
use App\Models\City;
use App\Models\Discipline;
use App\Models\TrainerDocument;
use App\Models\TrainerPhoto;
use App\Models\TrainerProfile;
use App\Models\User;
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
 */
class SaveTrainerProfile
{
    /**
     * @param  array<string, mixed>  $data  validated by TrainerProfileRequest
     */
    public function handle(User $user, array $data): TrainerProfile
    {
        // Files written before a failed transaction are removed at the end.
        $newFiles = [];

        try {
            return DB::transaction(function () use ($user, $data, &$newFiles) {
                $profile = $user->trainerProfile ?? new TrainerProfile;
                $profile->user_id = $user->id;
                $profile->slug ??= TrainerProfile::uniqueSlug($user->name);

                $citySlugs = [$data['city'] ?? null, ...$data['other_cities'] ?? []];
                $cityIds = City::whereIn('slug', array_filter($citySlugs))->pluck('id', 'slug');
                $places = array_map(PlaceType::from(...), array_values(array_unique($data['places'])));
                $inPerson = array_filter($places, fn (PlaceType $place) => $place !== PlaceType::Online) !== [];
                $mainCityId = $inPerson ? ($cityIds[$data['city'] ?? ''] ?? null) : null;

                $profile->fill([
                    'headline' => trim($data['headline']),
                    'bio' => trim($data['bio']),
                    'experience' => $data['experience'],
                    'city_id' => $mainCityId,
                    'session_minutes' => $this->sessionMinutes($data['session_minutes']),
                    // null = "Nessun limite".
                    'max_sessions_per_day' => $data['max_sessions_per_day'] ?? null,
                    'auto_confirm' => (bool) $data['auto_confirm'],
                    ...array_intersect_key($data, TrainerProfileRequest::RULE_OPTIONS),
                ]);
                // A separate online price only for who trains both online and in person.
                $onlinePrice = $inPerson && in_array(PlaceType::Online, $places, true) && filled($data['online_price_cents'] ?? null)
                    ? (int) $data['online_price_cents']
                    : null;
                // "da 45 €" in the search: the lowest hourly price.
                $prices = array_filter([(int) $data['hourly_price_cents'], $onlinePrice]);

                $profile->forceFill([
                    'status' => TrainerProfileStatus::Review,
                    'status_changed_at' => now(),
                    'trains_online' => in_array(PlaceType::Online, $places, true),
                    'trains_in_person' => $inPerson,
                    'price_from_cents' => $prices === [] ? null : min($prices),
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
                $this->saveServices($profile, $data, $onlinePrice, $data['first_session'] ?? null, $data['packages'] ?? []);
                $this->saveHours($profile, $data['hours'] ?? []);
                $newFiles = [...$newFiles, ...$this->savePhoto($profile, $data['photo'] ?? null)];
                $newFiles = [...$newFiles, ...$this->saveCertifications($profile, $data['certifications'] ?? [])];

                TrainerSlots::refresh($profile->load('workingHours'));

                // The user may have read "no profile" before: now it has one.
                $user->setRelation('trainerProfile', $profile);

                return $profile;
            });
        } catch (\Throwable $exception) {
            foreach ($newFiles as [$disk, $path]) {
                Storage::disk($disk)->delete($path);
            }

            throw $exception;
        }
    }

    /**
     * "Durate prenotabili" as whole minutes, shortest first: ['90', '60'] → [60, 90].
     * Forms with files send them as text.
     *
     * @param  list<int|string>  $minutes
     * @return list<int>
     */
    private function sessionMinutes(array $minutes): array
    {
        $minutes = array_values(array_unique(array_map(intval(...), $minutes)));
        sort($minutes);

        return $minutes;
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
                $rows[] = ['type' => PlaceType::Studio, 'name' => trim($studio['name']), 'address' => trim($studio['address']), 'city_id' => $cityId];
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
     * "Servizi e prezzi" becomes rows of `services`, in this order:
     * - "Seduta singola": hourly price, bookable in every duration of step 5;
     * - "Seduta online": the same, online only, when it has its own price;
     * - the first session (optional): fixed duration, can be free (0);
     * - the packages (at most 3): sessions × duration, total price.
     *
     * @param  array<string, mixed>  $data  validated by TrainerProfileRequest
     * @param  array{name: string, minutes: int|string, price_cents: int|string, note?: string|null}|null  $first
     * @param  list<array{sessions: int|string, minutes: int|string, price_cents: int|string, note?: string|null}>  $packages
     */
    private function saveServices(TrainerProfile $profile, array $data, ?int $onlinePrice, ?array $first, array $packages): void
    {
        // TODO (step 5): bookings will point to services; then hide the old ones instead of deleting them.
        $profile->services()->delete();

        $note = fn (mixed $text) => filled($text) ? trim((string) $text) : null;
        $hourly = ['kind' => 'session', 'minutes' => 60, 'price_per_hour' => true, 'fixed_duration' => false];
        $rows = [[...$hourly, 'name' => 'Seduta singola', 'price_cents' => (int) $data['hourly_price_cents'], 'note' => $note($data['single_note'] ?? null)]];

        if ($onlinePrice !== null) {
            $rows[] = [...$hourly, 'name' => 'Seduta online', 'price_cents' => $onlinePrice, 'note' => $note($data['online_note'] ?? null), 'online_only' => true];
        }

        if ($first !== null) {
            $rows[] = [
                'kind' => 'session',
                'name' => trim($first['name']),
                'minutes' => (int) $first['minutes'],
                'price_cents' => (int) $first['price_cents'],
                'note' => $note($first['note'] ?? null),
            ];
        }

        foreach ($packages as $package) {
            $rows[] = [
                'kind' => 'package',
                'name' => "Pacchetto {$package['sessions']} sedute",
                'minutes' => (int) $package['minutes'],
                'price_cents' => (int) $package['price_cents'],
                'package_sessions' => (int) $package['sessions'],
                'note' => $note($package['note'] ?? null),
            ];
        }

        foreach ($rows as $index => $row) {
            $profile->services()->create([...$row, 'sort' => $index]);
        }
    }

    /**
     * The grid has whole start hours; consecutive hours become one range:
     * 7, 8, 9, 10, 11 → 07:00–12:00.
     *
     * @param  array<int|string, list<int|string>>  $hours  0 = Monday … 6 = Sunday
     */
    private function saveHours(TrainerProfile $profile, array $hours): void
    {
        $profile->workingHours()->delete();

        foreach ($hours as $day => $dayHours) {
            $starts = array_unique(array_map(intval(...), $dayHours));
            sort($starts);
            $ranges = [];

            foreach ($starts as $hour) {
                $last = array_key_last($ranges);

                if ($last !== null && $ranges[$last][1] === $hour) {
                    $ranges[$last][1] = $hour + 1;
                } else {
                    $ranges[] = [$hour, $hour + 1];
                }
            }

            foreach ($ranges as [$from, $to]) {
                $profile->workingHours()->create([
                    'weekday' => (int) $day + 1,
                    'starts_at' => sprintf('%02d:00', $from),
                    'ends_at' => sprintf('%02d:00', $to),
                ]);
            }
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
     * keeps its file, unless a new file replaces it.
     *
     * @param  list<array{id?: int|null, title: string, issuer?: string|null, year?: int|null, file?: UploadedFile|null}>  $certifications
     * @return list<array{string, string}> the files written: [disk, path]
     */
    private function saveCertifications(TrainerProfile $profile, array $certifications): array
    {
        $old = $profile->documents()->where('type', 'certificate')->get()->keyBy('id');
        $written = [];
        $kept = [];

        foreach ($certifications as $index => $certification) {
            $previous = $old->get((int) ($certification['id'] ?? 0));
            $path = $previous?->path;
            $file = $certification['file'] ?? null;

            if ($file !== null) {
                $stored = $file->store("trainers/{$profile->id}/certificates", TrainerDocument::DISK);

                if ($stored === false) {
                    throw new \RuntimeException('A certificate could not be stored.');
                }

                $written[] = [TrainerDocument::DISK, $stored];
                $path = $stored;
            } elseif ($previous !== null) {
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
