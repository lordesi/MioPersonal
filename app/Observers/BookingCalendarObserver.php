<?php

namespace App\Observers;

use App\Jobs\SyncCalendarJob;
use App\Models\Booking;
use App\Models\TrainerCalendarConnection;
use Illuminate\Contracts\Events\ShouldHandleEventsAfterCommit;

/**
 * A booking that is confirmed, moved or called off is written on (or taken
 * off) the Google calendar of its trainer, if they linked one.
 */
class BookingCalendarObserver implements ShouldHandleEventsAfterCommit
{
    private const WATCHED = ['status', 'starts_at', 'ends_at', 'place_label', 'service_name', 'people'];

    public function saved(Booking $booking): void
    {
        if (! $booking->wasRecentlyCreated && ! $booking->wasChanged(self::WATCHED)) {
            return;
        }

        if (TrainerCalendarConnection::query()->where('trainer_profile_id', $booking->trainer_profile_id)->exists()) {
            SyncCalendarJob::dispatch('booking', $booking->id);
        }
    }
}
