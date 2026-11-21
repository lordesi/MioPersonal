<?php

namespace App\Policies;

use App\Models\GymPhoto;
use App\Models\User;
use App\Policies\Concerns\ChecksOwnership;
use Illuminate\Auth\Access\Response;

class GymPhotoPolicy
{
    use ChecksOwnership;

    public function asGym(User $user, GymPhoto $photo): Response
    {
        return $this->ownedIf($this->ofGym($user, $photo->gym_profile_id));
    }
}
