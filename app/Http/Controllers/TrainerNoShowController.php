<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

/**
 * "Saltata": a session is done as soon as it ends; the trainer can mark it as
 * missed, and take the mark back, within Booking::NO_SHOW_DAYS. The client
 * doesn't see it: it only feeds the attendance rate (ClientAttendance).
 */
class TrainerNoShowController extends Controller
{
    public function store(Request $request, Booking $booking): RedirectResponse
    {
        $this->ensureCanChange($booking);

        $booking->forceFill(['no_show_at' => now()])->save();

        return back();
    }

    public function destroy(Request $request, Booking $booking): RedirectResponse
    {
        $this->ensureCanChange($booking);

        $booking->forceFill(['no_show_at' => null])->save();

        return back();
    }

    /** 404 for another trainer's booking; an error when it is not over or too late. */
    private function ensureCanChange(Booking $booking): void
    {
        Gate::authorize('asTrainer', $booking);

        if ($booking->canChangeNoShow()) {
            return;
        }

        throw ValidationException::withMessages([
            'booking' => $booking->ends_at->isFuture()
                ? 'La seduta non è ancora finita.'
                : 'Sono passati più di '.Booking::NO_SHOW_DAYS.' giorni: la seduta non si può più cambiare.',
        ]);
    }
}
