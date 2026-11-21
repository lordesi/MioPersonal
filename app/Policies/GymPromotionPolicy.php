<?php

namespace App\Policies;

use App\Models\GymPromotion;
use App\Models\User;
use App\Policies\Concerns\ChecksOwnership;
use Illuminate\Auth\Access\Response;

class GymPromotionPolicy
{
    use ChecksOwnership;

    public function asGym(User $user, GymPromotion $promotion): Response
    {
        return $this->ownedIf($this->ofGym($user, $promotion->gym_profile_id));
    }
}
