<?php

namespace App\Policies;

use App\Models\TrainerPhoto;
use App\Models\User;
use App\Policies\Concerns\ChecksOwnership;
use Illuminate\Auth\Access\Response;

class TrainerPhotoPolicy
{
    use ChecksOwnership;

    public function asTrainer(User $user, TrainerPhoto $photo): Response
    {
        return $this->ownedIf($this->ofTrainer($user, $photo->trainer_profile_id));
    }
}
