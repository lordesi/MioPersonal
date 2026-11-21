<?php

namespace App\Http\Controllers\Concerns;

use App\Enums\TrainerProfileStatus;
use App\Enums\TrainerReviewDecision;
use App\Models\Conversation;
use App\Models\TrainerProfile;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;

/**
 * What the pages of the trainer area share: the data of the trainer layout
 * and the date helpers.
 */
trait BuildsTrainerArea
{
    /** The trainer profile of who is signed in: 404 without one. */
    private function trainerProfile(Request $request): TrainerProfile
    {
        return $this->trainerProfileOrNull($request) ?? abort(404);
    }

    /** The trainer profile of who is signed in, if any (e.g. made trainer by the team, registration not sent). */
    private function trainerProfileOrNull(Request $request): ?TrainerProfile
    {
        /** @var User $user */
        $user = $request->user();

        return $user->trainerProfile;
    }

    private function romeNow(): CarbonImmutable
    {
        return CarbonImmutable::now('Europe/Rome');
    }

    /**
     * Data the trainer layout needs on every page of the trainer area: the
     * link to the public profile and its status, for the notice at the top
     * ("In revisione", "Modifiche richieste"…).
     *
     * pendingCount: the bookings waiting for an answer, for the badge of "Richieste".
     *
     * @return array{pendingCount: int, unreadChats: int, publicProfileHref: string|null, profile: array{status: string, message: string|null}}
     */
    private function trainerArea(): array
    {
        /** @var User $user */
        $user = request()->user();
        $profile = $user->trainerProfile;

        // The team's message goes with "Modifiche richieste" and "Rifiutato".
        $message = $profile !== null && in_array($profile->status, [TrainerProfileStatus::Changes, TrainerProfileStatus::Rejected], true)
            ? $profile->decisions()->whereIn('decision', [TrainerReviewDecision::Changes, TrainerReviewDecision::Rejected])->value('message_to_trainer')
            : null;

        return [
            'pendingCount' => $profile === null ? 0 : $profile->bookings()->awaitingAnswer()->fromClient()->count(),
            // Conversations with messages the trainer hasn't read: the badge of "Clienti".
            'unreadChats' => $profile === null ? 0 : Conversation::query()
                ->whereNotNull('last_message_at')
                ->where(fn ($unread) => $unread->whereNull('trainer_read_at')->orWhereColumn('trainer_read_at', '<', 'last_message_at'))
                ->whereHas('trainerClient', fn ($record) => $record->where('trainer_profile_id', $profile->id)->whereNotNull('user_id'))
                ->count(),
            'publicProfileHref' => $profile === null ? null : route('trainers.show', $profile->slug, false),
            'profile' => [
                // 'missing': the registration was never sent (e.g. made trainer by the team).
                'status' => $profile->status->value ?? 'missing',
                'message' => $message,
            ],
        ];
    }
}
