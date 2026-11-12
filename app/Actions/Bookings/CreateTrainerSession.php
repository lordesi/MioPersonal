<?php

namespace App\Actions\Bookings;

use App\Enums\BookingActor;
use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Service;
use App\Models\TrainerClient;
use App\Models\TrainerPlace;
use App\Models\TrainerProfile;
use App\Notifications\BookingChanged;
use App\Support\TrainerSlots;
use Carbon\CarbonImmutable;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * "Aggiungi seduta" in the trainer's calendar: a session with someone of the
 * trainer's list ("Clienti"), at any time, also outside the open hours. The
 * trainer chose it, so the only check is that it doesn't overlap another
 * session (break included).
 *
 * - Without an account: confirmed at once, only in the trainer's calendar.
 *   When the person signs up with the personal link the sessions become
 *   theirs (LinkClient).
 * - With an account: a proposal. The client accepts or declines it
 *   (ClientSessionProposalController); without an answer it lapses when the
 *   session starts.
 */
class CreateTrainerSession
{
    public const OVERLAP = 'A quest’ora hai già un’altra seduta: scegli un altro orario.';

    public const MIN_MINUTES = 15;

    public const MAX_MINUTES = 240;

    /** PostgreSQL error code of an exclusion constraint (`bookings_no_overlap`). */
    private const EXCLUSION_VIOLATION = '23P01';

    public function handle(TrainerProfile $profile, TrainerClient $record, Service $service, CarbonImmutable $start, int $minutes, ?TrainerPlace $place = null): Booking
    {
        if ($record->trainer_profile_id !== $profile->id || $service->trainer_profile_id !== $profile->id) {
            abort(404);
        }

        if ($service->kind !== 'session' || ! $service->is_active) {
            throw ValidationException::withMessages(['service_id' => 'Scegli una delle tue sedute.']);
        }

        if ($minutes < self::MIN_MINUTES || $minutes > self::MAX_MINUTES || $minutes % 5 !== 0) {
            throw ValidationException::withMessages(['minutes' => 'La durata va da '.self::MIN_MINUTES.' a '.self::MAX_MINUTES.' minuti.']);
        }

        if ($start->isPast()) {
            throw ValidationException::withMessages(['start' => 'Scegli un orario nel futuro.']);
        }

        $end = $start->addMinutes($minutes);
        $blockedUntil = $end->addMinutes($profile->break_minutes);
        $offApp = ! $record->isRegistered();
        $trainer = $profile->user;

        try {
            $booking = DB::transaction(function () use ($profile, $record, $service, $start, $end, $blockedUntil, $offApp, $place, $trainer) {
                // As when a client books: one booking at a time for this trainer.
                TrainerProfile::whereKey($profile->id)->lockForUpdate()->first();
                $profile->bookings()->overdue()->get()->each(fn (Booking $request) => $request->expire());

                if (self::overlaps($profile, $start, $blockedUntil)) {
                    throw ValidationException::withMessages(['start' => self::OVERLAP]);
                }

                $booking = Booking::create([
                    'client_id' => $record->user_id,
                    'trainer_client_id' => $record->id,
                    'requested_by' => BookingActor::Trainer,
                    'trainer_profile_id' => $profile->id,
                    'service_id' => $service->id,
                    'service_name' => $service->displayName(),
                    'price_cents' => $service->price_cents,
                    'place_label' => app(CreateBooking::class)->placeLabel($profile, $service->online_only, $place),
                    'starts_at' => $start->utc(),
                    'ends_at' => $end->utc(),
                    'blocked_until' => $blockedUntil->utc(),
                    'status' => $offApp ? BookingStatus::Confirmed : BookingStatus::Pending,
                    // The client can answer until the session starts.
                    'expires_at' => $offApp ? null : $start->utc(),
                    'confirmed_at' => $offApp ? now() : null,
                ]);

                $booking->record($offApp ? 'confirmed' : 'requested', $trainer);

                return $booking;
            });
        } catch (QueryException $exception) {
            if ($exception->getCode() === self::EXCLUSION_VIOLATION) {
                throw ValidationException::withMessages(['start' => self::OVERLAP]);
            }

            throw $exception;
        }

        TrainerSlots::refresh($profile);

        if (! $offApp) {
            $booking->client?->notify(new BookingChanged($booking, 'trainer-proposed'));
        }

        return $booking;
    }

    /**
     * Another session of the trainer between `$start` and `$blockedUntil`
     * (its break included), confirmed or still waiting for an answer.
     */
    public static function overlaps(TrainerProfile $profile, \DateTimeInterface $start, \DateTimeInterface $blockedUntil, ?int $exceptBookingId = null): bool
    {
        return $profile->bookings()
            ->active()
            ->when($exceptBookingId !== null, fn ($query) => $query->whereKeyNot($exceptBookingId))
            // Saved in UTC: the query compares the text of the dates.
            ->where('starts_at', '<', CarbonImmutable::instance($blockedUntil)->utc())
            ->where('blocked_until', '>', CarbonImmutable::instance($start)->utc())
            ->exists();
    }
}
