<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\BuildsPlaceholderData;
use Carbon\CarbonInterface;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Calendario" of the trainer: the week and the month of their sessions.
 * Empty until bookings are stored (step 5 of docs/database/analisi.md): a new
 * trainer sees an empty calendar, never sample appointments.
 */
class TrainerCalendarController extends Controller
{
    use BuildsPlaceholderData;

    public function __invoke(): Response
    {
        $monday = $this->romeNow()->startOfWeek(CarbonInterface::MONDAY);

        return Inertia::render('trainer/calendar', [
            'trainerArea' => $this->trainerArea(),
            'weekStart' => $monday->toDateString(),
            // TODO (step 5): the trainer's bookings of the week.
            'events' => [],
            // TODO (step 5): confirmed sessions per day, for the month view.
            'sessionCounts' => (object) [],
        ]);
    }
}
