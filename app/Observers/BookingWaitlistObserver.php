<?php

namespace App\Observers;

use App\Actions\Waitlist\Waitlist;
use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\WaitlistEntry;
use App\Support\TrainerSlots;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Events\ShouldHandleEventsAfterCommit;

/**
 * A booking that is cancelled, declined, expired or moved frees a slot: the
 * people waiting for that day are told (App\Actions\Waitlist\Waitlist).
 */
class BookingWaitlistObserver implements ShouldHandleEventsAfterCommit
{
    public function updated(Booking $booking): void
    {
        if (! $booking->wasChanged(['status', 'starts_at', 'ends_at'])) {
            return;
        }

        $original = $booking->getOriginal('starts_at');
        $days = collect([$booking->starts_at, $original])
            ->filter()
            ->map(fn ($start) => CarbonImmutable::parse($start)->setTimezone(TrainerSlots::TIMEZONE)->toDateString())
            ->unique();

        // Taken again (a request answered "yes") frees nothing.
        if (in_array($booking->status, BookingStatus::active(), true) && ! $booking->wasChanged(['starts_at', 'ends_at'])) {
            return;
        }

        foreach ($days as $day) {
            if (WaitlistEntry::query()->where('trainer_profile_id', $booking->trainer_profile_id)->whereDate('day', $day)->exists()) {
                app(Waitlist::class)->notifyDay($booking->trainerProfile()->with('workingHours')->first(), $day);
            }
        }
    }
}
