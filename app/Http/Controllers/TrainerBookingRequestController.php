<?php

namespace App\Http\Controllers;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\User;
use App\Support\TrainerSlots;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * "Conferma" and "Rifiuta" of the requests in the trainer's "Richieste" page.
 * Only the trainer's own requests, still waiting for an answer.
 */
class TrainerBookingRequestController extends Controller
{
    public function accept(Request $request, Booking $booking): RedirectResponse
    {
        $this->ensureCanAnswer($request, $booking);

        /** @var User $trainer */
        $trainer = $request->user();
        // The first session of a package also buys it.
        $booking->confirm($trainer);

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
