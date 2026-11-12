<?php

namespace App\Support;

use App\Models\TrainerProfile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * How fast a trainer answers the booking requests: the median minutes from
 * "requested" to the trainer's own "confirmed" or "declined" (booking_events).
 * Automatic confirmations (no actor) and the "sedute fisse" (never
 * requested) don't count. Saved in trainer_profiles.response_minutes once a
 * day (`trainers:response-times`), shown on the profile.
 */
class ResponseTimes
{
    public const DAYS = 90;

    /** Answers needed before the profile shows the time. */
    public const MIN_ANSWERS = 5;

    /** Every trainer: the ones without enough answers go back to null. */
    public static function refreshAll(): void
    {
        $minutes = [];

        DB::table('bookings')
            ->join('booking_events as requested', function ($join) {
                $join->on('requested.booking_id', '=', 'bookings.id')->where('requested.type', 'requested');
            })
            ->join('trainer_profiles', 'trainer_profiles.id', '=', 'bookings.trainer_profile_id')
            ->join('booking_events as answer', function ($join) {
                $join->on('answer.booking_id', '=', 'bookings.id')
                    ->whereIn('answer.type', ['confirmed', 'declined'])
                    // The trainer's own answer, not the automatic confirmation.
                    ->whereColumn('answer.actor_id', 'trainer_profiles.user_id');
            })
            ->where('requested.created_at', '>=', now()->subDays(self::DAYS))
            ->groupBy('bookings.id', 'bookings.trainer_profile_id', 'requested.created_at')
            ->select('bookings.trainer_profile_id', 'requested.created_at as requested_at', DB::raw('min(answer.created_at) as answered_at'))
            ->orderBy('bookings.id')
            ->each(function (object $row) use (&$minutes) {
                $from = Carbon::parse($row->requested_at);
                $to = Carbon::parse($row->answered_at);
                $minutes[(int) $row->trainer_profile_id][] = max(0, (int) round($from->diffInMinutes($to)));
            });

        $medians = array_map(
            fn (array $values) => count($values) >= self::MIN_ANSWERS ? self::median($values) : null,
            $minutes,
        );

        TrainerProfile::query()
            ->whereNotNull('response_minutes')
            ->whereNotIn('id', array_keys(array_filter($medians, fn ($median) => $median !== null)))
            ->update(['response_minutes' => null]);

        foreach ($medians as $profileId => $median) {
            if ($median !== null) {
                TrainerProfile::query()->whereKey($profileId)->update(['response_minutes' => $median]);
            }
        }
    }

    /** "Risponde in genere entro 1 ora"; null without a time. */
    public static function label(?int $minutes): ?string
    {
        return match (true) {
            $minutes === null => null,
            $minutes <= 60 => 'Risponde in genere entro 1 ora',
            $minutes <= 180 => 'Risponde in genere entro 3 ore',
            $minutes <= 720 => 'Risponde in genere entro 12 ore',
            default => 'Risponde in genere entro un giorno',
        };
    }

    /**
     * @param  list<int>  $values
     */
    private static function median(array $values): int
    {
        sort($values);
        $middle = intdiv(count($values), 2);

        return count($values) % 2 === 1
            ? $values[$middle]
            : (int) round(($values[$middle - 1] + $values[$middle]) / 2);
    }
}
