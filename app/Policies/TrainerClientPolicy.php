<?php

namespace App\Policies;

use App\Models\TrainerClient;
use App\Models\User;
use App\Policies\Concerns\ChecksOwnership;
use Illuminate\Auth\Access\Response;

class TrainerClientPolicy
{
    use ChecksOwnership;

    /** The trainer's own list of clients: records, payments, notes, series. */
    public function asTrainer(User $user, TrainerClient $client): Response
    {
        return $this->ownedIf($this->ofTrainer($user, $client->trainer_profile_id));
    }

    /** "Messaggi": only the two people of the conversation, the trainer and the client with an account. */
    public function converse(User $user, TrainerClient $client): Response
    {
        return $this->ownedIf($client->user_id !== null
            && ($client->user_id === $user->id || $this->ofTrainer($user, $client->trainer_profile_id)));
    }
}
