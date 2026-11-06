<?php

namespace App\Actions\Gym;

use App\Enums\GymLinkSide;
use App\Enums\GymLinkStatus;
use App\Enums\PlaceType;
use App\Models\GymProfile;
use App\Models\GymTrainerLink;
use App\Models\TrainerProfile;
use App\Notifications\GymLinkAccepted;
use App\Notifications\GymLinkRequested;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * The only place where a trainer joins or leaves a gym (gym_trainer):
 * - one side asks (the trainer: request, the gym: invite), the other accepts
 *   or declines; asking when the other side already asked accepts at once;
 * - accepted, the trainer gets a "gym" place (profile, search by city,
 *   booking); removed by either side, the place goes;
 * - after a "no", the same side can ask again only after COOLDOWN_DAYS.
 *
 * A trainer's request is sent to the gym only once the trainer is approved
 * (AdminVerificationController sends the ones waiting).
 */
class GymLinks
{
    public const MAX_GYMS_PER_TRAINER = 5;

    public const COOLDOWN_DAYS = 30;

    public const MESSAGE_MAX = 300;

    /** "Chiedi di allenare qui", from the trainer. */
    public function request(TrainerProfile $trainer, GymProfile $gym, ?string $message = null, bool $notify = true): GymTrainerLink
    {
        abort_unless($gym->isApproved() && $gym->ownerIsActive(), 404);

        return $this->ask($trainer, $gym, GymLinkSide::Trainer, $message, $notify && $trainer->isApproved());
    }

    /** "Invita", from the gym: only approved trainers. */
    public function invite(GymProfile $gym, TrainerProfile $trainer, ?string $message = null): GymTrainerLink
    {
        abort_unless($trainer->isApproved() && $trainer->ownerIsActive(), 404);

        if (! $gym->isApproved()) {
            throw ValidationException::withMessages(['trainer' => 'Potrai invitare i trainer quando il profilo della palestra sarà approvato.']);
        }

        return $this->ask($trainer, $gym, GymLinkSide::Gym, $message, true);
    }

    public function accept(GymTrainerLink $link, GymLinkSide $side): void
    {
        if (! $link->awaits($side)) {
            throw ValidationException::withMessages(['link' => 'Questa richiesta non aspetta la tua risposta.']);
        }

        $this->ensureRoom($link->trainerProfile, $link);

        DB::transaction(function () use ($link) {
            $link->forceFill(['status' => GymLinkStatus::Accepted, 'responded_at' => now()])->save();
            $this->addPlace($link);
        });

        $this->notifyInitiator($link);
    }

    public function decline(GymTrainerLink $link, GymLinkSide $side): void
    {
        if (! $link->awaits($side)) {
            throw ValidationException::withMessages(['link' => 'Questa richiesta non aspetta la tua risposta.']);
        }

        $link->forceFill(['status' => GymLinkStatus::Declined, 'responded_at' => now()])->save();
    }

    /**
     * "Rimuovi" (either side, once accepted) or "Annulla richiesta" (the side
     * that asked, while pending): the row goes, with the trainer's place.
     */
    public function remove(GymTrainerLink $link, GymLinkSide $side): void
    {
        $allowed = $link->status === GymLinkStatus::Accepted
            || ($link->isPending() && $link->initiated_by === $side);

        if (! $allowed) {
            throw ValidationException::withMessages(['link' => 'Non puoi rimuovere questa richiesta.']);
        }

        DB::transaction(function () use ($link) {
            $link->trainerProfile->places()->where('gym_profile_id', $link->gym_profile_id)->delete();
            $link->delete();
            self::refreshInPerson($link->trainerProfile);
        });
    }

    /**
     * The trainer's requests made before the approval: sent to the gyms now.
     */
    public function sendWaitingRequests(TrainerProfile $trainer): void
    {
        $trainer->gymLinks()
            ->where('status', GymLinkStatus::Pending)
            ->where('initiated_by', GymLinkSide::Trainer)
            ->with('gymProfile.user')
            ->get()
            ->each(fn (GymTrainerLink $link) => $link->gymProfile->user->notify(new GymLinkRequested($link)));
    }

    /** trains_in_person follows the places: a gym place counts. */
    public static function refreshInPerson(TrainerProfile $trainer): void
    {
        $trainer->forceFill([
            'trains_in_person' => $trainer->places()->where('type', '!=', PlaceType::Online)->exists(),
        ])->save();
    }

    private function ask(TrainerProfile $trainer, GymProfile $gym, GymLinkSide $side, ?string $message, bool $notify): GymTrainerLink
    {
        $message = filled($message) ? mb_substr(trim((string) $message), 0, self::MESSAGE_MAX) : null;
        $link = GymTrainerLink::where('gym_profile_id', $gym->id)->where('trainer_profile_id', $trainer->id)->first();

        if ($link?->status === GymLinkStatus::Accepted) {
            throw ValidationException::withMessages(['link' => 'Siete già collegati.']);
        }

        if ($link !== null && $link->isPending()) {
            // The other side already asked: this is a yes.
            if ($link->awaits($side)) {
                $this->accept($link, $side);

                return $link;
            }

            throw ValidationException::withMessages(['link' => 'Hai già inviato la richiesta: aspetta la risposta.']);
        }

        if ($link !== null && $link->initiated_by === $side && $link->responded_at?->gt(now()->subDays(self::COOLDOWN_DAYS))) {
            throw ValidationException::withMessages(['link' => 'La richiesta è stata rifiutata da poco: potrai riprovare tra qualche settimana.']);
        }

        $this->ensureRoom($trainer, $link);

        $link ??= new GymTrainerLink;
        $link->gym_profile_id = $gym->id;
        $link->trainer_profile_id = $trainer->id;
        $link->forceFill([
            'status' => GymLinkStatus::Pending,
            'initiated_by' => $side,
            'message' => $message,
            'responded_at' => null,
        ])->save();

        $link->setRelation('gymProfile', $gym)->setRelation('trainerProfile', $trainer);

        if ($notify) {
            $recipient = $side === GymLinkSide::Trainer ? $gym->user : $trainer->user;
            $recipient->notify(new GymLinkRequested($link));
        }

        return $link;
    }

    /** At most MAX_GYMS_PER_TRAINER gyms, requests included ($ignore doesn't count). */
    private function ensureRoom(TrainerProfile $trainer, ?GymTrainerLink $ignore): void
    {
        $count = $trainer->gymLinks()
            ->where('status', '!=', GymLinkStatus::Declined)
            ->when($ignore?->exists, fn ($query) => $query->whereKeyNot($ignore->id))
            ->count();

        if ($count >= self::MAX_GYMS_PER_TRAINER) {
            throw ValidationException::withMessages(['link' => 'Un trainer può allenare al massimo in '.self::MAX_GYMS_PER_TRAINER.' palestre.']);
        }
    }

    private function addPlace(GymTrainerLink $link): void
    {
        $trainer = $link->trainerProfile;
        $gym = $link->gymProfile;

        $trainer->places()->updateOrCreate(
            ['gym_profile_id' => $gym->id],
            ['type' => PlaceType::Gym, 'city_id' => $gym->city_id, 'sort' => ((int) $trainer->places()->max('sort')) + 1],
        );

        self::refreshInPerson($trainer);
    }

    private function notifyInitiator(GymTrainerLink $link): void
    {
        $recipient = $link->initiated_by === GymLinkSide::Trainer
            ? $link->trainerProfile->user
            : $link->gymProfile->user;

        $recipient->notify(new GymLinkAccepted($link));
    }
}
