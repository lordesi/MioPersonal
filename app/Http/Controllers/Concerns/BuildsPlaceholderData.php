<?php

namespace App\Http\Controllers\Concerns;

use App\Enums\TrainerProfileStatus;
use App\Enums\TrainerReviewDecision;
use App\Models\User;
use Carbon\CarbonImmutable;

/**
 * Date helpers and the data of the trainer layout, for the trainer area; the
 * admin pages still use them for their placeholder data.
 * TODO: rename once the admin pages read from the database.
 */
trait BuildsPlaceholderData
{
    private function romeNow(): CarbonImmutable
    {
        return CarbonImmutable::now('Europe/Rome');
    }

    /** A Rome date `$days` from today at `$hour`:`$minute`. */
    private function at(CarbonImmutable $now, int $days, int $hour, int $minute = 0): CarbonImmutable
    {
        return $now->startOfDay()->addDays($days)->setTime($hour, $minute);
    }

    /** Dates go to the frontend in UTC; the browser shows them in Europe/Rome. */
    private function iso(CarbonImmutable $date): string
    {
        return $date->utc()->format('Y-m-d\TH:i:s\Z');
    }

    /**
     * Data the trainer layout needs on every page of the trainer area: the
     * link to the public profile and its status, for the notice at the top
     * ("In revisione", "Modifiche richieste"…).
     *
     * pendingCount: the bookings waiting for an answer, for the badge of "Richieste".
     *
     * @return array{pendingCount: int, publicProfileHref: string|null, profile: array{status: string, message: string|null}}
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
            'pendingCount' => $profile === null ? 0 : $profile->bookings()->awaitingAnswer()->count(),
            'publicProfileHref' => $profile === null ? null : route('trainers.show', $profile->slug, false),
            'profile' => [
                // 'missing': the registration was never sent (e.g. made trainer by the team).
                'status' => $profile->status->value ?? 'missing',
                'message' => $message,
            ],
        ];
    }
}
