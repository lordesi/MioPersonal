<?php

namespace App\Policies;

use App\Models\BookingSeries;
use App\Models\User;
use App\Policies\Concerns\ChecksOwnership;
use Illuminate\Auth\Access\Response;

class BookingSeriesPolicy
{
    use ChecksOwnership;

    /** "Sedute fisse": only the trainer who made them. */
    public function asTrainer(User $user, BookingSeries $series): Response
    {
        return $this->ownedIf($this->ofTrainer($user, $series->trainer_profile_id));
    }
}
