<?php

namespace App\Jobs;

use App\Actions\Calendar\SyncCalendar;
use App\Models\Booking;
use App\Models\GroupSession;
use App\Models\TrainerCalendarConnection;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Brings a Google calendar in line with a session, an event, or (without a
 * subject) with everything to come. Run apart from the request: Google being
 * slow or down never holds up, or breaks, a booking.
 */
class SyncCalendarJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 4;

    /**
     * @param  'booking'|'group_session'|'connection'  $type
     */
    public function __construct(public string $type, public int $id)
    {
        $this->afterCommit();
    }

    /** @return list<int> seconds before each new try */
    public function backoff(): array
    {
        return [30, 120, 600];
    }

    public function handle(SyncCalendar $sync): void
    {
        try {
            if ($this->type === 'booking') {
                $booking = Booking::query()->with('client')->find($this->id);
                $booking !== null && $sync->booking($booking);
            } elseif ($this->type === 'group_session') {
                $session = GroupSession::query()->find($this->id);
                $session !== null && $sync->groupSession($session);
            } else {
                $connection = TrainerCalendarConnection::query()->find($this->id);
                $connection !== null && $sync->everything($connection);
            }
        } catch (Throwable $exception) {
            // A synchronous queue (local, tests) has no retries and runs inside the
            // request: Google failing must never break the booking. The daily
            // calendar:resync puts it right.
            if (config('queue.default') === 'sync') {
                Log::warning('Google Calendar sync failed: '.$exception->getMessage());

                return;
            }

            throw $exception;
        }
    }
}
