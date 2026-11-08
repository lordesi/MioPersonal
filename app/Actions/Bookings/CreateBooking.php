<?php

namespace App\Actions\Bookings;

use App\Enums\BookingStatus;
use App\Enums\PlaceType;
use App\Models\Booking;
use App\Models\ClientPackage;
use App\Models\Service;
use App\Models\TrainerPlace;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Notifications\BookingRequested;
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

    /**
     * A session of a service. A package service also creates the package:
     * this booking is its first session. "Invita un amico": `$people` with
     * the booker, at the total price of the service for them.
     */
    public function handle(User $client, TrainerProfile $profile, Service $service, CarbonImmutable $start, int $minutes, ?TrainerPlace $place = null, int $people = 1): Booking
    {
        $this->ensureDurationIsAllowed($service, $minutes);
        $price = $this->priceFor($service, $people);

        return $this->book($client, $profile, $start, $minutes, function () use ($client, $profile, $service, $place, $people, $price) {
            // Inside the lock: two requests of the same client can't both be "the first".
            $this->ensureFirstSessionIsFirst($profile, $service, $client);

            return [
                'service_id' => $service->id,
                'client_package_id' => $service->kind === 'package' ? $this->newPackage($client, $profile, $service)->id : null,
                'service_name' => $service->displayName(),
                'price_cents' => $price,
                'people' => $people,
                'invite_token' => $people > 1 ? Booking::newInviteToken() : null,
                'place_label' => $this->placeLabel($profile, $service->online_only, $place),
            ];
        });
    }

    /** The total for `$people`: only up to the people the trainer allows for this service. */
    private function priceFor(Service $service, int $people): int
    {
        $price = $service->priceFor($people);

        if ($price === null) {
            throw ValidationException::withMessages(['people' => $service->maxPeople() > 1
                ? "Questa seduta è per al massimo {$service->maxPeople()} persone."
                : 'Questa seduta è per una persona sola.']);
        }

        return $price;
    }

    /**
     * "Il tuo pacchetto": one more session of a package the client bought.
     * Free, it was paid with the package.
     */
    public function fromPackage(User $client, ClientPackage $package, CarbonImmutable $start, ?TrainerPlace $place = null): Booking
    {
        $profile = $package->trainerProfile;

        return $this->book($client, $profile, $start, $package->minutes, function () use ($client, $package, $profile, $place) {
            // Counted inside the lock: two requests can't both take the last session.
            $booked = $package->activeBookings()->count();

            if ($package->client_id !== $client->id || $package->bought_at === null || $booked >= $package->sessions_total) {
                throw ValidationException::withMessages(['client_package_id' => 'Questo pacchetto non ha più sedute da prenotare.']);
            }

            return [
                'service_id' => $package->service_id,
                'client_package_id' => $package->id,
                'service_name' => $package->name,
                'price_cents' => 0,
                'place_label' => $this->placeLabel($profile, false, $place),
            ];
        });
    }

    /**
     * The part every booking shares: the checks, the lock on the trainer, the
     * free slot and the automatic confirmation.
     *
     * @param  callable(): array<string, mixed>  $details  run inside the lock: what is booked
     */
    private function book(User $client, TrainerProfile $profile, CarbonImmutable $start, int $minutes, callable $details): Booking
    {
        $this->ensureNotPaused($profile);
        $this->ensureAcceptsClient($profile, $client);

        try {
            $booking = DB::transaction(function () use ($client, $profile, $start, $minutes, $details) {
                // One booking at a time for this trainer, until the transaction ends.
                TrainerProfile::whereKey($profile->id)->lockForUpdate()->first();

                // Requests not answered in time, if bookings:expire hasn't run yet:
                // still "pending", they would keep the slot for `bookings_no_overlap`.
                $profile->bookings()->overdue()->get()->each(fn (Booking $request) => $request->expire());

                if (! TrainerSlots::isFree($profile, $start, $minutes)) {
                    throw ValidationException::withMessages(['start' => self::SLOT_TAKEN]);
                }

                $end = $start->addMinutes($minutes);

                $booking = Booking::create([
                    ...$details(),
                    'client_id' => $client->id,
                    'trainer_profile_id' => $profile->id,
                    'starts_at' => $start->utc(),
                    'ends_at' => $end->utc(),
                    'blocked_until' => $end->addMinutes($profile->break_minutes)->utc(),
                    'status' => BookingStatus::Pending,
                    'expires_at' => now()->addHours($profile->confirm_hours),
                ]);

                $booking->record('requested', $client);

                // "Conferma automatica": confirmed right away, and the package is bought.
                if ($profile->auto_confirm) {
                    $booking->confirm();
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

        // "Nuova richiesta di prenotazione" (or "confermata", with automatic confirmation).
        $profile->user->notify(new BookingRequested($booking));

        return $booking;
    }

    /** Bought when its first session (this booking) is confirmed. */
    private function newPackage(User $client, TrainerProfile $profile, Service $service): ClientPackage
    {
        return $profile->clientPackages()->create([
            'client_id' => $client->id,
            'service_id' => $service->id,
            'name' => $service->displayName(),
            'price_cents' => $service->price_cents,
            'sessions_total' => $service->package_sessions ?? 1,
            'minutes' => $service->minutes,
        ]);
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
        // Or the trainer's account is suspended, or being deleted.
        if ($profile->paused_at !== null || ! $profile->ownerIsActive()) {
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
     * Copied on the booking: "Online" for online services, the place the
     * client chose ("Dove", e.g. a gym), else the place when the trainer has
     * only one, otherwise empty (the pages hide it).
     */
    private function placeLabel(TrainerProfile $profile, bool $online, ?TrainerPlace $chosen = null): string
    {
        if ($online) {
            return PlaceType::Online->label();
        }

        if ($chosen !== null && $chosen->trainer_profile_id === $profile->id && $chosen->type !== PlaceType::Online) {
            return $chosen->label();
        }

        $places = $profile->places()->with(['city', 'gymProfile.city'])->get()
            ->reject(fn (TrainerPlace $place) => $place->type === PlaceType::Online);

        if ($places->count() !== 1) {
            return '';
        }

        /** @var TrainerPlace $place */
        $place = $places->first();

        return $place->label();
    }
}
