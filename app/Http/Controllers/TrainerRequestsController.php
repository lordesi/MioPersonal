<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\BuildsPlaceholderData;
use App\Models\User;
use App\Support\TrainerBookingRequests;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Richieste": every booking waiting for the trainer's answer, with
 * "Accetta" and "Rifiuta" (TrainerBookingRequestController).
 */
class TrainerRequestsController extends Controller
{
    use BuildsPlaceholderData;

    public function __invoke(Request $request): Response
    {
        /** @var User $trainer */
        $trainer = $request->user();
        $profile = $trainer->trainerProfile;

        return Inertia::render('trainer/requests', [
            'trainerArea' => $this->trainerArea(),
            // No profile yet (registration not sent): nobody could book.
            'requests' => $profile === null ? [] : TrainerBookingRequests::rows(TrainerBookingRequests::query($profile)->get(), $profile),
        ]);
    }
}
