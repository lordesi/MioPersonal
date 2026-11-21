<?php

namespace App\Policies;

use App\Models\BodyMeasurement;
use App\Models\User;
use App\Policies\Concerns\ChecksOwnership;
use Illuminate\Auth\Access\Response;

class BodyMeasurementPolicy
{
    use ChecksOwnership;

    /** "Progressi": the client's own weights. */
    public function asClient(User $user, BodyMeasurement $measurement): Response
    {
        return $this->ownedIf($measurement->user_id === $user->id);
    }
}
