<?php

namespace App\Policies;

use App\Models\GymCourse;
use App\Models\User;
use App\Policies\Concerns\ChecksOwnership;
use Illuminate\Auth\Access\Response;

class GymCoursePolicy
{
    use ChecksOwnership;

    /** The course, its lessons and its photos. */
    public function asGym(User $user, GymCourse $course): Response
    {
        return $this->ownedIf($this->ofGym($user, $course->gym_profile_id));
    }
}
