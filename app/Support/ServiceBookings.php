<?php

namespace App\Support;

use App\Enums\BookingStatus;
use App\Models\Booking;
use Illuminate\Database\Eloquent\Builder;

/**
 * How many sessions of each service were confirmed (and not cancelled), by
 * service_id: "Il più prenotato" on the profile, the numbers of "Servizi e
 * prezzi" and "Servizi più prenotati" in Admin · Statistiche.
 */
class ServiceBookings
{
    /** "Il più prenotato": the last 90 days, at least 5 sessions. */
    public const DAYS = 90;

    public const MOST_BOOKED_MIN = 5;

    /**
     * service id => sessions confirmed in the last `$days` days.
     *
     * @return array<int, int>
     */
    public static function counts(?int $trainerProfileId, int $days = self::DAYS): array
    {
        return self::confirmed($days)
            ->when($trainerProfileId !== null, fn (Builder $query) => $query->where('trainer_profile_id', $trainerProfileId))
            ->groupBy('service_id')
            ->selectRaw('service_id, count(*) as total')
            ->pluck('total', 'service_id')
            ->mapWithKeys(fn ($total, $serviceId) => [(int) $serviceId => (int) $total])
            ->all();
    }

    /**
     * @return Builder<Booking>
     */
    private static function confirmed(int $days): Builder
    {
        return Booking::query()
            ->whereNotNull('service_id')
            ->whereNotNull('confirmed_at')
            ->where('confirmed_at', '>=', now()->subDays($days))
            ->where('status', '!=', BookingStatus::Cancelled);
    }
}
