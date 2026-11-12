<?php

namespace App\Http\Controllers;

use App\Actions\Bookings\CreateBookingSeries;
use App\Enums\BookingActor;
use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\User;
use App\Notifications\BookingRepeatDeclined;
use App\Support\TrainerSlots;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

/**
 * "Conferma" and "Rifiuta" of the requests in the trainer's "Richieste" page.
 * Only the trainer's own requests, still waiting for an answer.
 */
class TrainerBookingRequestController extends Controller
{
    /**
     * "Conferma". When the client asked "Ripeti ogni settimana": "Accetta
     * ogni settimana" (`weekly`) also sets the "sedute fisse" from this
     * session; "Solo questa seduta" confirms it alone.
     */
    public function accept(Request $request, Booking $booking, CreateBookingSeries $series): RedirectResponse
    {
        $this->ensureCanAnswer($request, $booking);
        $request->validate(['weekly' => ['nullable', 'boolean']]);
        $weekly = $request->boolean('weekly');

        /** @var User $trainer */
        $trainer = $request->user();
        // The first session of a package also buys it.
        $booking->confirm($trainer);

        if (! $booking->repeat_weekly) {
            return back();
        }

        if (! $weekly) {
            $booking->client?->notify(new BookingRepeatDeclined($booking));

            return back();
        }

        try {
            $result = $series->fromRequest($booking);
        } catch (ValidationException $exception) {
            // The session stays confirmed: only the repetition is not set.
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Seduta confermata, ma le sedute fisse non sono partite: '.lcfirst(collect($exception->errors())->flatten()->first() ?? 'riprova dalla scheda del cliente.')]);

            return back();
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Sedute fisse attive. '.TrainerSeriesController::createdMessage($result['created'], $result['skipped'])]);

        return back();
    }

    /** The slot is free again on the profile. */
    public function decline(Request $request, Booking $booking): RedirectResponse
    {
        $this->ensureCanAnswer($request, $booking);

        $booking->forceFill(['status' => BookingStatus::Declined, 'expires_at' => null])->save();
        $booking->record('declined', $request->user());
        TrainerSlots::refresh($booking->trainerProfile);

        return back();
    }

    /**
     * 404 for another trainer's booking; an error when it is too late to answer.
     * The page shows the confirmation itself, so success needs no message.
     */
    private function ensureCanAnswer(Request $request, Booking $booking): void
    {
        /** @var User $trainer */
        $trainer = $request->user();

        abort_unless($booking->trainer_profile_id === $trainer->trainerProfile?->id, 404);
        // "Aggiungi seduta": the client answers, not the trainer (ClientSessionProposalController).
        abort_if($booking->requested_by === BookingActor::Trainer, 404);

        if ($booking->isPending()) {
            return;
        }

        throw ValidationException::withMessages([
            'booking' => $booking->isExpired()
                ? 'La richiesta è scaduta: lo slot è tornato libero.'
                : 'Hai già risposto a questa richiesta, o il cliente l’ha annullata.',
        ]);
    }
}
