<?php

namespace App\Jobs;

use App\Actions\Calendar\SyncBusyTimes;
use App\Models\TrainerCalendarConnection;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Reads again when a trainer is busy on Google ("Blocca gli orari occupati").
 * Run apart from the request: Google being slow or down never holds up a page.
 */
class SyncBusyTimesJob implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    /** A read already waiting is enough. */
    public int $uniqueFor = 600;

    public function __construct(public int $connectionId)
    {
        $this->afterCommit();
    }

    public function uniqueId(): string
    {
        return (string) $this->connectionId;
    }

    /** @return list<int> seconds before each new try */
    public function backoff(): array
    {
        return [30, 120];
    }

    public function handle(SyncBusyTimes $sync): void
    {
        $connection = TrainerCalendarConnection::query()->with('trainerProfile')->find($this->connectionId);

        if ($connection === null) {
            return;
        }

        try {
            $sync->run($connection);
        } catch (Throwable $exception) {
            // Synchronous queue (local, tests): no retries, and inside the request.
            // The next calendar:busy tries again.
            if (config('queue.default') === 'sync') {
                Log::warning('Google Calendar busy times failed: '.$exception->getMessage());

                return;
            }

            throw $exception;
        }
    }
}
