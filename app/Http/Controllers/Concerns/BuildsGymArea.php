<?php

namespace App\Http\Controllers\Concerns;

use App\Enums\GymLinkSide;
use App\Enums\GymLinkStatus;
use App\Enums\TrainerProfileStatus;
use App\Enums\TrainerReviewDecision;
use App\Models\GymProfile;
use App\Models\GymTrainerLink;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * What the gym layout needs on every page of the gym area: the link to the
 * public profile, its status (notice at the top) and the trainers' requests
 * waiting for an answer (badge on "Trainer").
 */
trait BuildsGymArea
{
    /**
     * @return array{pendingCount: int, publicProfileHref: string|null, profile: array{status: string, message: string|null}}
     */
    private function gymArea(): array
    {
        $profile = $this->gym();

        $message = $profile !== null && in_array($profile->status, [TrainerProfileStatus::Changes, TrainerProfileStatus::Rejected], true)
            ? $profile->decisions()->whereIn('decision', [TrainerReviewDecision::Changes, TrainerReviewDecision::Rejected])->value('message_to_gym')
            : null;

        return [
            'pendingCount' => $profile === null ? 0 : self::awaitingGym($profile)->count(),
            'publicProfileHref' => $profile === null ? null : route('gyms.show', $profile->slug, false),
            'profile' => [
                'status' => $profile->status->value ?? 'missing',
                'message' => $message,
            ],
        ];
    }

    private function gym(): ?GymProfile
    {
        /** @var User $user */
        $user = request()->user();

        return $user->gymProfile;
    }

    /** The gym's profile; without one the page makes no sense: to the registration. */
    private function gymOrFail(): GymProfile
    {
        $profile = $this->gym();

        abort_if($profile === null, 404);

        return $profile;
    }

    /**
     * Trainers' requests waiting for the gym; only from approved trainers.
     *
     * @return HasMany<GymTrainerLink, GymProfile>
     */
    private static function awaitingGym(GymProfile $profile): HasMany
    {
        return $profile->links()
            ->where('status', GymLinkStatus::Pending)
            ->where('initiated_by', GymLinkSide::Trainer)
            ->whereHas('trainerProfile', fn (Builder $trainer) => $trainer->where('status', TrainerProfileStatus::Approved));
    }
}
