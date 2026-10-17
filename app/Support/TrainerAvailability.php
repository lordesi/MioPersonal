<?php

namespace App\Support;

use App\Http\Requests\TrainerProfileRequest;
use App\Models\TrainerProfile;

/**
 * Working hours and booking rules of a trainer, shared by step 5 of
 * "Diventa trainer" and by "Disponibilità" in the trainer area.
 *
 * The page uses a grid: for each day (0 = Monday … 6 = Sunday) the whole
 * hours where a session can start. The database keeps ranges in
 * `trainer_working_hours`: 7, 8, 9, 10, 11 → 07:00–12:00.
 */
class TrainerAvailability
{
    /**
     * The saved hours and rules in the format of the page (TrainerDraft in draft.ts).
     *
     * @return array{hours: array<int, list<int>>, rules: array{noticeHours: int, bookingWindowDays: int, breakMinutes: int, maxSessionsPerDay: int|null, freeCancellationHours: int}, autoConfirm: bool}
     */
    public static function fromProfile(TrainerProfile $profile): array
    {
        $hours = array_fill(0, 7, []);

        foreach ($profile->workingHours as $range) {
            $hours[$range->weekday - 1] = [...$hours[$range->weekday - 1], ...$range->startHours()];
        }

        return [
            'hours' => array_map(function (array $day) {
                sort($day);

                return $day;
            }, $hours),
            'rules' => [
                'noticeHours' => $profile->notice_hours,
                'bookingWindowDays' => $profile->booking_window_days,
                'breakMinutes' => $profile->break_minutes,
                // null = "Nessun limite".
                'maxSessionsPerDay' => $profile->max_sessions_per_day,
                'freeCancellationHours' => $profile->free_cancellation_hours,
            ],
            'autoConfirm' => $profile->auto_confirm,
        ];
    }

    /**
     * The columns of `trainer_profiles` for the validated rules.
     *
     * @param  array<string, mixed>  $data  validated with TrainerProfileRequest::availabilityRules()
     * @return array<string, mixed>
     */
    public static function attributes(array $data): array
    {
        // The durations (session_minutes) come from the prices: see SaveTrainerServices.
        return [
            // null = "Nessun limite".
            'max_sessions_per_day' => $data['max_sessions_per_day'] ?? null,
            'auto_confirm' => (bool) $data['auto_confirm'],
            ...array_intersect_key($data, TrainerProfileRequest::RULE_OPTIONS),
        ];
    }

    /**
     * Replaces the working hours; consecutive hours become one range.
     *
     * @param  array<int|string, list<int|string>>  $hours  0 = Monday … 6 = Sunday
     */
    public static function saveHours(TrainerProfile $profile, array $hours): void
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
}
