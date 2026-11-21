<?php

namespace App\Policies;

use App\Models\GymTrainerLink;
use App\Models\User;
use App\Policies\Concerns\ChecksOwnership;
use Illuminate\Auth\Access\Response;

/** A trainer and a gym: each side answers or ends only its own links. */
class GymTrainerLinkPolicy
{
    use ChecksOwnership;

    public function asTrainer(User $user, GymTrainerLink $link): Response
    {
        return $this->ownedIf($this->ofTrainer($user, $link->trainer_profile_id));
    }

    public function asGym(User $user, GymTrainerLink $link): Response
    {
        return $this->ownedIf($this->ofGym($user, $link->gym_profile_id));
    }
}
