<?php

namespace App\Actions\Calendar;

use App\Models\TrainerCalendarConnection;
use App\Models\TrainerProfile;
use App\Support\Calendar\CalendarAccessRevoked;
use App\Support\Calendar\GoogleCalendar;
use App\Support\TrainerSlots;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * "Blocca gli orari occupati", the other way of "Collega Google Calendar":
 * reads when the trainer is busy on their Google calendars, from now to the
 * end of the booking window, and keeps those times (only the times) in
 * `calendar_busy_times`. TrainerSlots doesn't offer them to the clients.
 *
 * Off, or the link to fix: nothing is read. Access lost: the times go (old
 * ones would block slots for nothing) and the trainer sees "Ricollega"; only
 * that permission taken off on Google: the option turns off by itself. Any
 * other failure keeps the last times and is thrown again, to be retried.
 */
class SyncBusyTimes
{
    /** Seconds Google has to answer while a client is sending a request. */
    private const LIVE_TIMEOUT = 5;

    public function run(TrainerCalendarConnection $connection): void
    {
        if (! $connection->readsBusy() || $connection->needsReconnect()) {
            return;
        }

        $profile = $connection->trainerProfile;
        $from = CarbonImmutable::now()->startOfHour();
        $to = $from->addDays($profile->booking_window_days + 1);

        try {
            $google = new GoogleCalendar($connection);
            $busy = $google->busy($from, $to, $google->busyCalendarIds());
        } catch (CalendarAccessRevoked $exception) {
            $this->revoked($connection, $exception);

            return;
        }

        DB::transaction(function () use ($connection, $busy) {
            $connection->busyTimes()->delete();
            $this->store($connection, $busy);
            $connection->forceFill(['busy_synced_at' => now()])->save();
        });

        TrainerSlots::refresh($profile);
    }

    /**
     * Live, when a client sends a request: whether the trainer is busy on
     * Google during the session (breaks included). The times saved every few
     * minutes may be old: a commitment added a moment ago counts too, and is
     * saved so the slot disappears for everyone.
     *
     * Google slow or down: not known, false (the saved times have decided).
     */
    public function isBusyAt(TrainerProfile $profile, CarbonImmutable $start, int $minutes): bool
    {
        $connection = $profile->calendarConnection;

        if ($connection === null || ! $connection->readsBusy() || $connection->needsReconnect()) {
            return false;
        }

        $from = $start->subMinutes($profile->break_minutes);
        $to = $start->addMinutes($minutes + $profile->break_minutes);

        try {
            $google = new GoogleCalendar($connection, self::LIVE_TIMEOUT);
            // Google gives only the busy times that overlap the session.
            $busy = $google->busy($from, $to, $google->busyCalendarIds());
        } catch (CalendarAccessRevoked $exception) {
            $this->revoked($connection, $exception);

            return false;
        } catch (Throwable $exception) {
            Log::warning('Google Calendar live busy check failed: '.$exception->getMessage());

            return false;
        }

        if ($busy === []) {
            return false;
        }

        // Next to the saved ones until the next full read replaces them all.
        $this->store($connection, $busy);
        TrainerSlots::refresh($profile);

        return true;
    }

    /**
     * @param  list<array{start: CarbonImmutable, end: CarbonImmutable}>  $busy
     */
    private function store(TrainerCalendarConnection $connection, array $busy): void
    {
        $connection->busyTimes()->createMany(array_map(
            fn (array $time) => ['starts_at' => $time['start'], 'ends_at' => $time['end']],
            $busy,
        ));
    }

    private function revoked(TrainerCalendarConnection $connection, CalendarAccessRevoked $exception): void
    {
        DB::transaction(function () use ($connection, $exception) {
            $connection->busyTimes()->delete();
            $connection->forceFill($exception->permissionOnly
                ? ['reads_busy_at' => null, 'busy_synced_at' => null]
                : ['last_error' => $exception->getMessage()])->save();
        });

        TrainerSlots::refresh($connection->trainerProfile);
    }
}
