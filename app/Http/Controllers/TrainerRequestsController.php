<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\BuildsPlaceholderData;
use App\Models\Booking;
use App\Models\User;
use App\Support\TrainerBookingRequests;
use App\Support\TrainerSlots;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Richieste": every booking waiting for the trainer's answer, with
 * "Conferma" and "Rifiuta" (TrainerBookingRequestController), and the
 * ones already answered or expired without an answer ("Gestite").
 */
class TrainerRequestsController extends Controller
{
    use BuildsPlaceholderData;

    public function __invoke(Request $request): Response
    {
        /** @var User $trainer */
        $trainer = $request->user();
        $profile = $trainer->trainerProfile;

        // Not answered in time: to "Gestite" now, without waiting for bookings:expire.
        $overdue = $profile === null ? collect() : $profile->bookings()->overdue()->get();

        if ($overdue->isNotEmpty()) {
            $overdue->each(fn (Booking $booking) => $booking->expire());
            TrainerSlots::refresh($profile);
        }

        return Inertia::render('trainer/requests', [
            'trainerArea' => $this->trainerArea(),
            // No profile yet (registration not sent): nobody could book.
            'requests' => $profile === null ? [] : TrainerBookingRequests::rows(TrainerBookingRequests::query($profile)->get(), $profile),
            'handled' => $profile === null ? [] : TrainerBookingRequests::handled($profile),
            // Off: "Gestite" suggests it when requests expired without an answer.
            'autoConfirm' => $profile->auto_confirm ?? false,
        ]);
    }
}
