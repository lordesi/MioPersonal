<?php

namespace App\Actions\Bookings;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Notifications\SessionReminder;
use Carbon\CarbonImmutable;

/**
 * The reminders of the confirmed sessions (bookings:remind, every 5 minutes):
 * - DAY_BEFORE, from 24 hours before: client and trainer;
 * - SOON, from 2 hours before: the client.
 *
 * Each booking is marked when its reminder is handled, so it goes out once.
 * A session confirmed inside the window (e.g. booked this morning for tonight)
 * is marked without a reminder: the confirmation just arrived.
 * Moving the session to another time clears the marks (Booking::booted()).
 */
class SendSessionReminders
{
    /** @return int how many reminders were sent */
    public function handle(): int
    {
        $now = CarbonImmutable::now();

        $dayBefore = $this->send(
            SessionReminder::DAY_BEFORE,
            'reminded_day_before_at',
            // Not when the SOON one is about to leave: one reminder is enough.
            $now->addHours(SessionReminder::SOON_HOURS + 1),
            $now->addHours(SessionReminder::DAY_BEFORE_HOURS),
            SessionReminder::DAY_BEFORE_HOURS,
        );

        $soon = $this->send(
            SessionReminder::SOON,
            'reminded_soon_at',
            $now,
            $now->addHours(SessionReminder::SOON_HOURS),
            SessionReminder::SOON_HOURS,
        );

        return $dayBefore + $soon;
    }

    private function send(string $kind, string $column, CarbonImmutable $after, CarbonImmutable $until, int $hours): int
    {
        $sent = 0;

        Booking::query()
            ->where('status', BookingStatus::Confirmed)
            ->whereNull($column)
            ->where('starts_at', '>', $after)
            ->where('starts_at', '<=', $until)
            ->with(['client', 'trainerProfile.user'])
            ->chunkById(100, function ($bookings) use ($kind, $column, $hours, &$sent) {
                foreach ($bookings as $booking) {
                    $booking->forceFill([$column => now()])->save();

                    // Confirmed after the reminder time: the confirmation is the reminder.
                    if ($booking->confirmed_at !== null && $booking->confirmed_at->gt($booking->starts_at->subHours($hours))) {
                        continue;
                    }

                    $booking->client?->notify(new SessionReminder($booking, $kind));

                    if ($kind === SessionReminder::DAY_BEFORE) {
                        $booking->trainerProfile->user->notify(new SessionReminder($booking, $kind));
                    }

                    $sent++;
                }
            });

        return $sent;
    }
}
