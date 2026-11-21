<?php

namespace App\Policies;

use App\Models\ActivityLog;
use App\Models\User;
use App\Policies\Concerns\ChecksOwnership;
use Illuminate\Auth\Access\Response;

class ActivityLogPolicy
{
    use ChecksOwnership;

    /** "Progressi": the client's own workouts. */
    public function asClient(User $user, ActivityLog $log): Response
    {
        return $this->ownedIf($log->user_id === $user->id);
    }
}
