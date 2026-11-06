<?php

namespace App\Http\Controllers;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\User;
use App\Notifications\BookingChanged;
use App\Support\TrainerSlots;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

/**
 * The client's answer to "Sposta" (TrainerSessionChangeController::propose):
 * "Accetta" moves the session, "Tieni l'orario" keeps it. Cancelling for free
 * is the usual "Annulla" (BookingController::cancel).
 */
class ClientRescheduleController extends Controller
{
    /** PostgreSQL: the new time overlaps another booking (bookings_no_overlap). */
    private const EXCLUSION_VIOLATION = '23P01';

    public function accept(Request $request, Booking $booking): RedirectResponse
    {
        $this->ensureCanAnswer($request, $booking);

        try {
            DB::transaction(function () use ($booking) {
                $profile = $booking->trainerProfile;
                $profile->newQuery()->whereKey($profile->id)->lockForUpdate()->first();

                $proposal = $booking->proposal();

                if ($proposal === null || $this->overlapsAnother($booking, $proposal['start'], $proposal['blockedUntil'])) {
                    throw ValidationException::withMessages(['booking' => 'Il nuovo orario non è più disponibile.']);
                }

                $booking->forceFill([
                    'starts_at' => $proposal['start'],
                    'ends_at' => $proposal['end'],
                    'blocked_until' => $proposal['blockedUntil'],
                    'proposed_starts_at' => null,
                    'proposal_expires_at' => null,
                ])->save();
                $booking->record('rescheduled', $booking->client);
            });
        } catch (QueryException $exception) {
            if ($exception->getCode() === self::EXCLUSION_VIOLATION) {
                throw ValidationException::withMessages(['booking' => 'Il nuovo orario non è più disponibile.']);
            }

            throw $exception;
        }

        TrainerSlots::refresh($booking->trainerProfile);
        $booking->trainerProfile->user->notify(new BookingChanged($booking, 'accepted'));
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Seduta spostata al nuovo orario.']);

        return back();
    }

    public function decline(Request $request, Booking $booking): RedirectResponse
    {
        $this->ensureCanAnswer($request, $booking);

        $booking->clearProposal();
        TrainerSlots::refresh($booking->trainerProfile);
        $booking->trainerProfile->user->notify(new BookingChanged($booking, 'declined'));
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Resta l’orario di prima: abbiamo avvisato il trainer.']);

        return back();
    }

    private function ensureCanAnswer(Request $request, Booking $booking): void
    {
        /** @var User $client */
        $client = $request->user();

        abort_unless($booking->client_id === $client->id, 404);

        if ($booking->status !== BookingStatus::Confirmed || $booking->proposal() === null) {
            throw ValidationException::withMessages(['booking' => 'Questa proposta non è più valida.']);
        }
    }

    /**
     * Another session of the trainer in the new time. The proposal held it
     * (TrainerSlots counts it as taken), so only a race gets here. Not the
     * notice: the trainer chose this time.
     */
    private function overlapsAnother(Booking $booking, \DateTimeInterface $start, \DateTimeInterface $blockedUntil): bool
    {
        return $booking->trainerProfile->bookings()
            ->active()
            ->whereKeyNot($booking->id)
            ->where('starts_at', '<', $blockedUntil)
            ->where('blocked_until', '>', $start)
            ->exists();
    }
}
