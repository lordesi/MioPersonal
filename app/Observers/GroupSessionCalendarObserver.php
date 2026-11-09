<?php

namespace App\Observers;

use App\Jobs\SyncCalendarJob;
use App\Models\GroupSession;
use App\Models\GroupSessionHost;
use App\Models\TrainerCalendarConnection;
use Illuminate\Contracts\Events\ShouldHandleEventsAfterCommit;

/**
 * An event (or its organizers) that changes is written on the Google calendar
 * of each trainer who hosts it, if they linked one.
 */
class GroupSessionCalendarObserver implements ShouldHandleEventsAfterCommit
{
    private const WATCHED = ['status', 'title', 'address', 'starts_at', 'ends_at'];

    public function saved(GroupSession|GroupSessionHost $model): void
    {
        if ($model instanceof GroupSessionHost) {
            $this->dispatch($model->group_session_id, $model->trainer_profile_id);

            return;
        }

        if (! $model->wasRecentlyCreated && ! $model->wasChanged(self::WATCHED)) {
            return;
        }

        $this->dispatch($model->id, null);
    }

    public function deleted(GroupSessionHost $host): void
    {
        $this->dispatch($host->group_session_id, $host->trainer_profile_id);
    }

    /** $trainerId: only that trainer's calendar matters (a host came or went). */
    private function dispatch(int $sessionId, ?int $trainerId): void
    {
        $linked = TrainerCalendarConnection::query()
            ->when($trainerId !== null, fn ($query) => $query->where('trainer_profile_id', $trainerId))
            ->exists();

        if ($linked) {
            SyncCalendarJob::dispatch('group_session', $sessionId);
        }
    }
}
