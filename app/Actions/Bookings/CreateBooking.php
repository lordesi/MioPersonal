<?php

namespace App\Actions\Bookings;

use App\Enums\BookingStatus;
use App\Enums\PlaceType;
use App\Models\Booking;
use App\Models\Service;
use App\Models\TrainerPlace;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Support\TrainerSlots;
use Carbon\CarbonImmutable;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * "Prenota questo slot": a client asks a trainer for a session.
 *
 * The slot is checked again here, inside a transaction that locks the trainer:
 * two clients clicking the same slot are handled one after the other, and the
 * second one gets «Slot appena preso». On PostgreSQL the `bookings_no_overlap`
 * constraint is a second safety net.
 */
class CreateBooking
{
    public const SLOT_TAKEN = 'Slot appena preso: qualcuno l’ha prenotato un attimo prima di te. Scegli un altro orario.';

    /** PostgreSQL error code of an exclusion constraint (`bookings_no_overlap`). */
    private const EXCLUSION_VIOLATION = '23P01';

    public function handle(User $client, TrainerProfile $profile, Service $service, CarbonImmutable $start, int $minutes): Booking
    {
        $this->ensureDurationIsAllowed($service, $minutes);
        $this->ensureNotPaused($profile);
        $this->ensureAcceptsClient($profile, $client);

        try {
            $booking = DB::transaction(function () use ($client, $profile, $service, $start, $minutes) {
                // One booking at a time for this trainer, until the transaction ends.
                TrainerProfile::whereKey($profile->id)->lockForUpdate()->first();

                // Inside the lock: two requests of the same client can't both be "the first".
                $this->ensureFirstSessionIsFirst($profile, $service, $client);

                if (! TrainerSlots::isFree($profile, $start, $minutes)) {
                    throw ValidationException::withMessages(['start' => self::SLOT_TAKEN]);
                }

                $end = $start->addMinutes($minutes);
                $confirmed = $profile->auto_confirm;

                $booking = Booking::create([
                    'client_id' => $client->id,
                    'trainer_profile_id' => $profile->id,
                    'service_id' => $service->id,
                    'starts_at' => $start->utc(),
                    'ends_at' => $end->utc(),
                    'blocked_until' => $end->addMinutes($profile->break_minutes)->utc(),
                    'service_name' => $service->displayName(),
                    'price_cents' => $service->price_cents,
                    'place_label' => $this->placeLabel($profile, $service),
                    'status' => $confirmed ? BookingStatus::Confirmed : BookingStatus::Pending,
                    'expires_at' => $confirmed ? null : now()->addHours($profile->confirm_hours),
                    'confirmed_at' => $confirmed ? now() : null,
                ]);

                $booking->record('requested', $client);

                if ($confirmed) {
                    $booking->record('confirmed');
                }

                return $booking;
            });
        } catch (QueryException $exception) {
            if ($exception->getCode() === self::EXCLUSION_VIOLATION) {
                throw ValidationException::withMessages(['start' => self::SLOT_TAKEN]);
            }

            throw $exception;
        }

        // The search shows the first free slot: it may have just been taken.
        TrainerSlots::refresh($profile);

        return $booking;
    }

    /**
     * Every service lasts its own minutes: each duration of a kind of session
     * is a row of its own, with its own price (see SaveTrainerServices).
     */
    private function ensureDurationIsAllowed(Service $service, int $minutes): void
    {
        if ($minutes !== $service->minutes) {
            throw ValidationException::withMessages(['minutes' => 'Scegli una delle durate proposte dal trainer.']);
        }
    }

    /** "Metti in pausa" in the settings: nobody can book until the trainer turns the profile back on. */
    private function ensureNotPaused(TrainerProfile $profile): void
    {
        if ($profile->paused_at !== null) {
            throw ValidationException::withMessages(['start' => 'Al momento questo trainer non accetta prenotazioni.']);
        }
    }

    /** "Accetta nuovi clienti" off: only who already booked this trainer can book again. */
    private function ensureAcceptsClient(TrainerProfile $profile, User $client): void
    {
        if ($profile->accepts_new_clients || $profile->bookings()->where('client_id', $client->id)->exists()) {
            return;
        }

        throw ValidationException::withMessages(['start' => 'Al momento questo trainer non accetta nuovi clienti.']);
    }

    /** "Prima seduta" only for the first booking of a client with this trainer. */
    private function ensureFirstSessionIsFirst(TrainerProfile $profile, Service $service, User $client): void
    {
        if ($service->isFirstSession() && $profile->hasBookingFrom($client)) {
            throw ValidationException::withMessages(['service_id' => 'La prima seduta è riservata a chi prenota con questo trainer per la prima volta.']);
        }
    }

    /**
     * The profile page doesn't ask where: "Online" for online services, the
     * place when the trainer has only one, otherwise they agree on it.
     */
    private function placeLabel(TrainerProfile $profile, Service $service): string
    {
        if ($service->online_only) {
            return PlaceType::Online->label();
        }

        $places = $profile->places()->with('city')->get()
            ->reject(fn (TrainerPlace $place) => $place->type === PlaceType::Online);

        if ($places->count() !== 1) {
            return 'Da concordare con il trainer';
        }

        /** @var TrainerPlace $place */
        $place = $places->first();

        return $place->type === PlaceType::Studio
            ? implode(' · ', array_filter([$place->name ?? 'Studio', $place->city?->name]))
            : $place->type->label();
    }
}
