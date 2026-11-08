<?php

namespace App\Actions\GroupSessions;

use App\Enums\GroupSessionStatus;
use App\Models\GroupSession;
use App\Models\GymProfile;
use App\Models\TrainerProfile;
use App\Notifications\GroupSessionChanged;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Validation\ValidationException;

/**
 * "Annulla l'evento" (the clients with a place are told; they stay in the
 * list, marked as cancelled), "Elimina" (only without clients), and a
 * lesson called off and then restored by the gym.
 */
class CancelGroupSession
{
    public function __construct(private SaveGroupSession $save) {}

    /**
     * @return int how many dates were cancelled
     */
    public function cancel(GroupSession $session, string $scope, ?string $note): int
    {
        if ($session->hasStarted()) {
            throw ValidationException::withMessages(['cancel' => 'L’evento è già iniziato.']);
        }

        $sessions = $this->save->affected($session, $scope);

        foreach ($sessions as $item) {
            $item->update([
                'status' => GroupSessionStatus::Cancelled,
                'cancelled_at' => now(),
                'cancel_note' => filled($note) ? trim((string) $note) : null,
            ]);

            $item->notifyRegistered(new GroupSessionChanged($item, GroupSessionChanged::CANCELLED));
        }

        return $sessions->count();
    }

    /**
     * A trainer or gym deletes its profile: its events to come are
     * cancelled, the clients told.
     */
    public function cancelOwnedBy(TrainerProfile|GymProfile $profile): void
    {
        $column = $profile instanceof TrainerProfile ? 'trainer_profile_id' : 'gym_profile_id';

        GroupSession::query()
            ->whereHas('hosts', fn (Builder $host) => $host->where($column, $profile->id)->where('is_owner', true))
            ->where('status', GroupSessionStatus::Published)
            ->upcoming()
            ->get()
            ->each(fn (GroupSession $session) => $this->cancel($session, SaveGroupSession::SCOPE_THIS, null));
    }

    /** A lesson called off takes place again: the places taken stay. */
    public function restore(GroupSession $session): void
    {
        if (! $session->isCancelled()) {
            return;
        }

        $session->update(['status' => GroupSessionStatus::Published, 'cancelled_at' => null, 'cancel_note' => null]);
        $session->notifyRegistered(new GroupSessionChanged($session, GroupSessionChanged::RESTORED));
    }

    /**
     * Deletes the dates without clients; the one asked must have none.
     *
     * @return int how many dates were deleted
     */
    public function delete(GroupSession $session, string $scope): int
    {
        if ($session->activeRegistrations()->exists()) {
            throw ValidationException::withMessages(['delete' => 'Ci sono clienti iscritti: annulla l’evento invece di eliminarlo, così vengono avvisati.']);
        }

        $deleted = 0;
        $covers = [];

        foreach ($this->save->affected($session, $scope) as $item) {
            if ($item->activeRegistrations()->exists()) {
                continue;
            }

            if ($item->cover_path !== null) {
                $covers[] = $item->cover_path;
            }

            $item->delete();
            $deleted++;
        }

        SaveGroupSession::deleteUnusedCovers($covers);

        return $deleted;
    }
}
