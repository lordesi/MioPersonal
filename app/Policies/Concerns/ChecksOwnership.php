<?php

namespace App\Policies\Concerns;

use App\Models\User;
use Illuminate\Auth\Access\Response;

/**
 * Someone else's record answers 404, as if it didn't exist (not 403: a 403
 * would tell that the ID is real). Used by the policies of app/Policies.
 */
trait ChecksOwnership
{
    private function ownedIf(bool $mine): Response
    {
        return $mine ? Response::allow() : Response::denyAsNotFound();
    }

    /** The record belongs to the trainer profile of this account. */
    private function ofTrainer(User $user, ?int $trainerProfileId): bool
    {
        $mine = $user->trainerProfile?->id;

        return $mine !== null && $mine === $trainerProfileId;
    }

    /** The record belongs to the gym profile of this account. */
    private function ofGym(User $user, ?int $gymProfileId): bool
    {
        $mine = $user->gymProfile?->id;

        return $mine !== null && $mine === $gymProfileId;
    }
}
