<?php

namespace App\Http\Controllers;

use App\Enums\BookingActor;
use App\Models\Booking;
use App\Models\User;
use App\Notifications\BookingChanged;
use App\Support\TrainerSlots;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

/**
 * "Annulla seduta" and "Sposta" of a confirmed session, from the calendar and
 * "Panoramica". Cancelling is at once (the package gets the session back);
 * moving is a proposal: the session moves only if the client accepts
 * (ClientRescheduleController), and meanwhile the new time is held.
 */
class TrainerSessionChangeController extends Controller
{
    public const NOTE_MAX = 300;

    public function cancel(Request $request, Booking $booking): RedirectResponse
    {
        $trainer = $this->ensureCanChange($request, $booking);
        $data = $request->validate(['note' => ['nullable', 'string', 'max:'.self::NOTE_MAX]], [
            'note.max' => 'Il messaggio può avere al massimo '.self::NOTE_MAX.' caratteri.',
        ]);

        $booking->forceFill(['cancel_note' => $data['note'] ?? null]);
        $booking->cancel(BookingActor::Trainer, $trainer);
        TrainerSlots::refresh($booking->trainerProfile);

        $booking->client?->notify(new BookingChanged($booking, 'cancelled-by-trainer'));
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Seduta annullata: abbiamo avvisato il cliente.']);

        return back();
    }

    /** "Sposta": one proposal at a time, a free time of the trainer's calendar. */
    public function propose(Request $request, Booking $booking): RedirectResponse
    {
        $this->ensureCanChange($request, $booking);
        $data = $request->validate(['start' => ['required', 'date']], ['start.*' => 'Scegli il nuovo orario.']);

        $start = CarbonImmutable::parse($data['start'])->utc();
        $minutes = (int) $booking->starts_at->diffInMinutes($booking->ends_at);
        $profile = $booking->trainerProfile;

        DB::transaction(function () use ($booking, $profile, $start, $minutes) {
            // As when booking: one change at a time for this trainer.
            $profile->newQuery()->whereKey($profile->id)->lockForUpdate()->first();

            if ($start->equalTo($booking->starts_at) || ! TrainerSlots::isFree($profile, $start, $minutes, exceptBookingId: $booking->id)) {
                throw ValidationException::withMessages(['start' => 'Questo orario non è libero: scegline un altro.']);
            }

            $booking->forceFill([
                'proposed_starts_at' => $start,
                // 48 hours, but never after the session (old or new) starts.
                'proposal_expires_at' => collect([now()->addHours(Booking::PROPOSAL_HOURS), $booking->starts_at, $start])->min(),
            ])->save();
            $booking->record('proposed');
        });

        TrainerSlots::refresh($profile);
        $booking->client?->notify(new BookingChanged($booking, 'proposed'));
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Proposta inviata: la seduta si sposta se il cliente accetta.']);

        return back();
    }

    /** "Ritira proposta": the session stays where it is. */
    public function withdraw(Request $request, Booking $booking): RedirectResponse
    {
        $this->ensureCanChange($request, $booking);

        $booking->clearProposal();
        TrainerSlots::refresh($booking->trainerProfile);

        return back();
    }

    /** 404 for another trainer's booking; an error when it can't be changed any more. */
    private function ensureCanChange(Request $request, Booking $booking): User
    {
        /** @var User $trainer */
        $trainer = $request->user();

        abort_unless($booking->trainer_profile_id === $trainer->trainerProfile?->id, 404);

        if (! $booking->canBeChangedByTrainer()) {
            throw ValidationException::withMessages(['booking' => 'Questa seduta non si può più modificare.']);
        }

        return $trainer;
    }
}
