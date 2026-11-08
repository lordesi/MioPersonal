<?php

namespace App\Actions\Gym;

use App\Actions\GroupSessions\CancelGroupSession;
use App\Models\GymPhoto;
use App\Models\GymProfile;
use App\Models\TrainerProfile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Deletes a gym's profile with the account: rows go by cascade (photos,
 * hours, plans, promotions, links and the trainers' "gym" places), the files
 * on the disk here. The trainers who worked there may not train in person
 * any more: their search field is computed again.
 */
class DeleteGymProfile
{
    public function handle(GymProfile $profile): void
    {
        $trainerIds = $profile->links()->pluck('trainer_profile_id')->all();
        $paths = $profile->photos()->pluck('path')->all();

        // Its events to come (and the lessons with places taken): cancelled, the clients told.
        app(CancelGroupSession::class)->cancelOwnedBy($profile);

        DB::transaction(fn () => $profile->delete());

        Storage::disk(GymPhoto::DISK)->delete($paths);
        Storage::disk(GymPhoto::DISK)->deleteDirectory("gyms/{$profile->id}");

        TrainerProfile::whereKey($trainerIds)->get()->each(fn (TrainerProfile $trainer) => GymLinks::refreshInPerson($trainer));
    }
}
