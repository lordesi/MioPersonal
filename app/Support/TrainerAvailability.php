<?php

namespace App\Support;

use App\Http\Requests\TrainerProfileRequest;
use App\Models\TrainerProfile;

/**
 * Working hours and booking rules of a trainer, shared by step 5 of
 * "Diventa trainer" and by "Disponibilità" in the trainer area.
 *
 * The page sends, for each day (0 = Monday … 6 = Sunday), ranges in minutes
 * on the half hour (WorkingRanges): {start: 450, end: 720} is 07:30–12:00.
 * The database keeps the same ranges in `trainer_working_hours`.
 */
class TrainerAvailability
{
    /**
     * The saved hours and rules in the format of the page (TrainerDraft in draft.ts).
     *
     * @return array{hours: array<int, list<array{start: int, end: int}>>, rules: array{noticeHours: int, bookingWindowDays: int, breakMinutes: int, maxSessionsPerDay: int|null, freeCancellationHours: int}, autoConfirm: bool}
     */
    public static function fromProfile(TrainerProfile $profile): array
    {
        $hours = array_fill(0, 7, []);

        foreach ($profile->workingHours as $range) {
            $hours[$range->weekday - 1][] = $range->range();
        }

        return [
            'hours' => array_map(fn (array $day) => WorkingRanges::forPage(WorkingRanges::normalize($day)), $hours),
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
     * Replaces the working hours; ranges that overlap or touch become one.
     *
     * @param  array<int|string, array<mixed>>  $hours  0 = Monday … 6 = Sunday
     */
    public static function saveHours(TrainerProfile $profile, array $hours): void
    {
        $profile->workingHours()->delete();

        foreach ($hours as $day => $ranges) {
            foreach (WorkingRanges::normalize((array) $ranges) as [$from, $to]) {
                $profile->workingHours()->create([
                    'weekday' => (int) $day + 1,
                    'starts_at' => WorkingRanges::time($from),
                    'ends_at' => WorkingRanges::time($to),
                ]);
            }
        }
    }
}
