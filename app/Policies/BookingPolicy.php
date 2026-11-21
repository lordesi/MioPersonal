<?php

namespace App\Policies;

use App\Models\Booking;
use App\Models\User;
use App\Policies\Concerns\ChecksOwnership;
use Illuminate\Auth\Access\Response;

class BookingPolicy
{
    use ChecksOwnership;

    /** The client who booked: cancel, review, answer a proposal, invite friends. */
    public function asClient(User $user, Booking $booking): Response
    {
        return $this->ownedIf($booking->client_id !== null && $booking->client_id === $user->id);
    }

    /** The trainer of the session: answer, change, notes, no-show. */
    public function asTrainer(User $user, Booking $booking): Response
    {
        return $this->ownedIf($this->ofTrainer($user, $booking->trainer_profile_id));
    }
}
