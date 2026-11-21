<?php

namespace App\Policies;

use App\Models\Review;
use App\Models\User;
use App\Policies\Concerns\ChecksOwnership;
use Illuminate\Auth\Access\Response;

class ReviewPolicy
{
    use ChecksOwnership;

    /** The reviewed trainer: the reply. */
    public function asTrainer(User $user, Review $review): Response
    {
        return $this->ownedIf($this->ofTrainer($user, $review->trainer_profile_id));
    }
}
