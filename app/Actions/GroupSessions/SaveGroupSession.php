<?php

namespace App\Actions\GroupSessions;

use App\Enums\GroupSessionPlace;
use App\Enums\GroupSessionStatus;
use App\Enums\GroupSessionType;
use App\Enums\GymLinkStatus;
use App\Models\Booking;
use App\Models\GroupSession;
use App\Models\GymProfile;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Notifications\GroupSessionChanged;
use App\Support\SafeImage;
use App\Support\TrainerSlots;
use Carbon\CarbonImmutable;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Makes and changes the events of the organizer area. "Ripeti ogni
 * settimana" makes one event per week (series_id), each with its places;
 * a change goes to "Solo questa data" or to "Questa e le successive".
 *
 * The data is GroupSessionRequest's: type, title, description,
 * discipline_id, place, gym_profile_id, address, city_id, date (Y-m-d,
 * Rome), start and end (H:i), capacity, price_cents, dates.
 */
class SaveGroupSession
{
    public const SCOPE_THIS = 'this';

    public const SCOPE_FOLLOWING = 'following';

    /**
     * @param  array<string, mixed>  $data
     * @return GroupSession the first date
     */
    public function create(TrainerProfile|GymProfile $owner, User $user, array $data, ?UploadedFile $cover): GroupSession
    {
        [$start, $end] = $this->times($data, $data['date']);
        $dates = max(1, min(GroupSession::MAX_DATES, (int) ($data['dates'] ?? 1)));
        $this->ensureTrainerIsFree($owner, $start, $end, $dates);

        $coverPath = $cover === null ? null : SafeImage::store($cover, 'events', GroupSession::DISK);

        try {
            return DB::transaction(function () use ($owner, $user, $data, $start, $end, $dates, $coverPath) {
                $seriesId = $dates > 1 ? (string) Str::uuid() : null;
                $first = null;

                foreach (range(0, $dates - 1) as $week) {
                    $session = GroupSession::create([
                        ...$this->attributes($data),
                        'series_id' => $seriesId,
                        'cover_path' => $coverPath,
                        'starts_at' => $start->addWeeks($week)->utc(),
                        'ends_at' => $end->addWeeks($week)->utc(),
                        'status' => GroupSessionStatus::Published,
                        'created_by_user_id' => $user->id,
                    ]);

                    $session->hosts()->create([
                        $owner instanceof TrainerProfile ? 'trainer_profile_id' : 'gym_profile_id' => $owner->id,
                        'is_owner' => true,
                        'status' => GymLinkStatus::Accepted,
                        'responded_at' => now(),
                    ]);

                    $first ??= $session;
                }

                /** @var GroupSession $first */
                return $first;
            });
        } catch (\Throwable $exception) {
            if ($coverPath !== null) {
                Storage::disk(GroupSession::DISK)->delete($coverPath);
            }

            throw $exception;
        }
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(GroupSession $session, array $data, string $scope, ?UploadedFile $cover, bool $removeCover): void
    {
        [$start, $end] = $this->times($data, $data['date']);
        $oldStart = $session->starts_at->setTimezone(TrainerSlots::TIMEZONE)->startOfDay();
        // "Questa e le successive" with another day: every date moves by as many days.
        $shiftDays = (int) $oldStart->diffInDays($start->startOfDay(), false);

        $sessions = $this->affected($session, $scope);
        $ownerHost = $session->owner();
        $owner = $ownerHost === null ? null : ($ownerHost->trainerProfile ?? $ownerHost->gymProfile);

        $newCover = $cover === null ? null : SafeImage::store($cover, 'events', GroupSession::DISK);
        $oldCovers = [];

        try {
            $moved = DB::transaction(function () use ($sessions, $data, $start, $end, $shiftDays, $newCover, $removeCover, $owner, &$oldCovers) {
                $moved = [];

                foreach ($sessions as $item) {
                    $item = GroupSession::query()->whereKey($item->id)->lockForUpdate()->firstOrFail();
                    $registered = $item->activeRegistrations()->count();

                    if ((int) $data['capacity'] < $registered) {
                        throw ValidationException::withMessages([
                            'capacity' => "Ci sono già {$registered} iscritti: i posti non possono essere meno.",
                        ]);
                    }

                    $day = $item->starts_at->setTimezone(TrainerSlots::TIMEZONE)->startOfDay()->addDays($shiftDays);
                    $itemStart = $day->setTime($start->hour, $start->minute);
                    $itemEnd = $day->setTime($end->hour, $end->minute);

                    if ($itemStart->lte(now())) {
                        throw ValidationException::withMessages(['date' => 'Scegli una data e un orario futuri.']);
                    }

                    if ($owner !== null && ($itemStart->ne($item->starts_at) || $itemEnd->ne($item->ends_at))) {
                        $this->ensureTrainerIsFree($owner, $itemStart, $itemEnd, 1);
                    }

                    $changedTime = ! $itemStart->eq($item->starts_at) || ! $itemEnd->eq($item->ends_at);

                    $item->fill([
                        ...$this->attributes($data),
                        'starts_at' => $itemStart->utc(),
                        'ends_at' => $itemEnd->utc(),
                        // Places taken outside the app stay, within the new capacity.
                        'offline_seats' => min($item->offline_seats, max(0, (int) $data['capacity'] - $registered)),
                    ]);

                    if ($newCover !== null || $removeCover) {
                        if ($item->cover_path !== null) {
                            $oldCovers[] = $item->cover_path;
                        }

                        $item->cover_path = $newCover;
                    }

                    $item->save();

                    if ($changedTime && $registered > 0) {
                        $moved[] = $item;
                    }
                }

                return $moved;
            });
        } catch (\Throwable $exception) {
            if ($newCover !== null) {
                Storage::disk(GroupSession::DISK)->delete($newCover);
            }

            throw $exception;
        }

        self::deleteUnusedCovers($oldCovers);

        foreach ($moved as $item) {
            $item->notifyRegistered(new GroupSessionChanged($item, GroupSessionChanged::MOVED));
        }
    }

    /**
     * This date, or this one and the next ones of its series, not cancelled.
     *
     * @return Collection<int, GroupSession>
     */
    public function affected(GroupSession $session, string $scope): Collection
    {
        if ($scope !== self::SCOPE_FOLLOWING || $session->series_id === null) {
            return collect([$session]);
        }

        return $session->series()
            ->where('starts_at', '>=', $session->starts_at)
            ->where('status', GroupSessionStatus::Published)
            ->orderBy('starts_at')
            ->get()
            ->toBase();
    }

    /**
     * The files no event uses any more.
     *
     * @param  list<string>  $paths
     */
    public static function deleteUnusedCovers(array $paths): void
    {
        foreach (array_unique($paths) as $path) {
            if (! GroupSession::query()->where('cover_path', $path)->exists()) {
                Storage::disk(GroupSession::DISK)->delete($path);
            }
        }
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function attributes(array $data): array
    {
        $place = GroupSessionPlace::from($data['place']);
        $gym = $place === GroupSessionPlace::Gym ? GymProfile::find((int) $data['gym_profile_id']) : null;

        return [
            'type' => GroupSessionType::from($data['type']),
            'title' => trim($data['title']),
            'description' => filled($data['description'] ?? null) ? trim($data['description']) : null,
            'discipline_id' => filled($data['discipline_id'] ?? null) ? (int) $data['discipline_id'] : null,
            'place' => $place,
            'gym_profile_id' => $gym?->id,
            'address' => $place === GroupSessionPlace::Address ? trim((string) $data['address']) : null,
            'city_id' => match ($place) {
                GroupSessionPlace::Gym => $gym?->city_id,
                GroupSessionPlace::Address => (int) $data['city_id'],
                GroupSessionPlace::Online => null,
            },
            'capacity' => (int) $data['capacity'],
            'price_cents' => (int) $data['price_cents'],
        ];
    }

    /**
     * Start and end in Rome time; the end on the same day, after the start.
     *
     * @param  array<string, mixed>  $data
     * @return array{CarbonImmutable, CarbonImmutable}
     */
    private function times(array $data, string $date): array
    {
        $start = CarbonImmutable::createFromFormat('Y-m-d H:i', "{$date} {$data['start']}", TrainerSlots::TIMEZONE);
        $end = CarbonImmutable::createFromFormat('Y-m-d H:i', "{$date} {$data['end']}", TrainerSlots::TIMEZONE);

        if ($start === null || $end === null) {
            throw ValidationException::withMessages(['date' => 'Scegli la data e l’orario.']);
        }

        if ($end->lte($start)) {
            throw ValidationException::withMessages(['end' => 'L’evento deve finire dopo l’inizio.']);
        }

        if ($start->lte(now())) {
            throw ValidationException::withMessages(['date' => 'Scegli una data e un orario futuri.']);
        }

        return [$start, $end];
    }

    /** A trainer's event can't overlap a session already booked with a client. */
    private function ensureTrainerIsFree(TrainerProfile|GymProfile $owner, CarbonImmutable $start, CarbonImmutable $end, int $weeks): void
    {
        if (! $owner instanceof TrainerProfile) {
            return;
        }

        foreach (range(0, $weeks - 1) as $week) {
            $busy = Booking::query()
                ->where('trainer_profile_id', $owner->id)
                ->active()
                ->where('starts_at', '<', $end->addWeeks($week)->utc())
                ->where('ends_at', '>', $start->addWeeks($week)->utc())
                ->exists();

            if ($busy) {
                throw ValidationException::withMessages([
                    'date' => 'In quell’orario hai già una seduta prenotata'.($week > 0 ? ' (il '.$start->addWeeks($week)->isoFormat('D MMMM').')' : '').'.',
                ]);
            }
        }
    }
}
