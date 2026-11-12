<?php

namespace App\Http\Controllers;

use App\Actions\Bookings\CreateTrainerSession;
use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\User;
use App\Notifications\BookingChanged;
use App\Support\TrainerSlots;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

/**
 * The client's answer to a session the trainer put in the calendar
 * ("Aggiungi seduta", CreateTrainerSession): "Accetta" confirms it,
 * "Rifiuta" frees the slot. The trainer hears of both.
 */
class ClientSessionProposalController extends Controller
{
    public function accept(Request $request, Booking $booking): RedirectResponse
    {
        $client = $this->ensureCanAnswer($request, $booking);

        DB::transaction(function () use ($booking, $client) {
            $profile = $booking->trainerProfile;
            $profile->newQuery()->whereKey($profile->id)->lockForUpdate()->first();

            // The proposal held the time: only a race gets here.
            if (CreateTrainerSession::overlaps($profile, $booking->starts_at, $booking->blocked_until, $booking->id)) {
                throw ValidationException::withMessages(['booking' => 'Questo orario non è più disponibile.']);
            }

            $booking->confirm($client);
        });

        $booking->trainerProfile->user->notify(new BookingChanged($booking, 'proposal-accepted'));
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Seduta confermata: abbiamo avvisato il trainer.']);

        return back();
    }

    public function decline(Request $request, Booking $booking): RedirectResponse
    {
        $client = $this->ensureCanAnswer($request, $booking);

        $booking->forceFill(['status' => BookingStatus::Declined, 'expires_at' => null])->save();
        $booking->record('declined', $client);
        TrainerSlots::refresh($booking->trainerProfile);

        $booking->trainerProfile->user->notify(new BookingChanged($booking, 'proposal-declined'));
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Seduta rifiutata: abbiamo avvisato il trainer.']);

        return back();
    }

    private function ensureCanAnswer(Request $request, Booking $booking): User
    {
        /** @var User $client */
        $client = $request->user();

        abort_unless($booking->client_id === $client->id, 404);

        if (! $booking->isTrainerProposal()) {
            throw ValidationException::withMessages(['booking' => 'Questa proposta non è più valida.']);
        }

        return $client;
    }
}
