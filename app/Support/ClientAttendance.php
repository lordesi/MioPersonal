<?php

namespace App\Support;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\TrainerProfile;

/**
 * How often a client shows up, only for the trainers: the confirmed sessions
 * already over, minus the ones a trainer marked as missed (`no_show_at`).
 * Two numbers: on all MioPersonal and with the trainer who is looking.
 * It never says which trainer marked the absences.
 *
 * @phpstan-type Rate array{rate: int, sessions: int}
 * @phpstan-type Attendance array{platform: Rate|null, withYou: Rate|null}
 */
final class ClientAttendance
{
    /**
     * One query for all the clients of a page, not one per client.
     *
     * @param  iterable<int|null>  $clientIds  deleted accounts (null) are skipped
     * @return array<int, Attendance> by client id; every id is there, also without sessions
     */
    public static function forClients(iterable $clientIds, TrainerProfile $trainer): array
    {
        $ids = array_values(array_unique(array_filter([...$clientIds], fn (?int $id) => $id !== null)));

        if ($ids === []) {
            return [];
        }

        // One row per client and trainer: how many sessions, how many missed.
        $rows = Booking::query()
            ->whereIn('client_id', $ids)
            ->where('status', BookingStatus::Confirmed)
            ->where('ends_at', '<=', now())
            ->selectRaw('client_id, trainer_profile_id, count(*) as sessions, count(no_show_at) as missed')
            ->groupBy('client_id', 'trainer_profile_id')
            ->toBase()
            ->get();

        // Sessions and missed ones: on all MioPersonal, and with this trainer only.
        $empty = ['sessions' => 0, 'missed' => 0];
        $all = array_fill_keys($ids, $empty);
        $withYou = array_fill_keys($ids, $empty);

        foreach ($rows as $row) {
            $client = (int) $row->client_id;
            $count = ['sessions' => (int) $row->sessions, 'missed' => (int) $row->missed];

            $total = $all[$client];
            $all[$client] = [
                'sessions' => $total['sessions'] + $count['sessions'],
                'missed' => $total['missed'] + $count['missed'],
            ];

            if ((int) $row->trainer_profile_id === $trainer->id) {
                $withYou[$client] = $count;
            }
        }

        $attendance = [];

        foreach ($ids as $id) {
            $attendance[$id] = [
                'platform' => self::rate($all[$id]),
                'withYou' => self::rate($withYou[$id]),
            ];
        }

        return $attendance;
    }

    /**
     * @return Attendance
     */
    public static function forClient(int $clientId, TrainerProfile $trainer): array
    {
        return self::forClients([$clientId], $trainer)[$clientId];
    }

    /**
     * "90" for 9 sessions done out of 10; null before the first session.
     *
     * @param  array{sessions: int, missed: int}  $count
     * @return Rate|null
     */
    private static function rate(array $count): ?array
    {
        ['sessions' => $sessions, 'missed' => $missed] = $count;

        if ($sessions === 0) {
            return null;
        }

        return ['rate' => (int) round(($sessions - $missed) / $sessions * 100), 'sessions' => $sessions];
    }
}
