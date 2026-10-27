<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\BuildsPlaceholderData;
use App\Models\Booking;
use App\Models\User;
use App\Support\TrainerPastSessions;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Sedute passate", the "Vedi tutte" of "Ultimi 7 giorni": every finished
 * session of the trainer, the most recent first, filtered by "Tutte",
 * "Effettuate" or "Saltate". "Saltata" only for the last 7 days; the older
 * ones just say how it went.
 */
class TrainerPastSessionsController extends Controller
{
    use BuildsPlaceholderData;

    private const PER_PAGE = 20;

    /** `?esito=` of the URL → filter of TrainerPastSessions::query(). */
    private const FILTERS = [
        'effettuate' => TrainerPastSessions::DONE,
        'saltate' => TrainerPastSessions::MISSED,
    ];

    public function __invoke(Request $request): Response
    {
        /** @var User $trainer */
        $trainer = $request->user();
        $profile = $trainer->trainerProfile;
        // Anything else (or nothing): "Tutte".
        $filter = self::FILTERS[$request->string('esito')->toString()] ?? null;

        // No profile yet (registration not sent): nobody could book.
        if ($profile === null) {
            return Inertia::render('trainer/past-sessions', [
                'trainerArea' => $this->trainerArea(),
                'sessions' => [],
                'pagination' => ['currentPage' => 1, 'lastPage' => 1],
                'filter' => $filter ?? 'all',
                'counts' => ['all' => 0, 'done' => 0, 'missed' => 0],
                'lastWeek' => ['sessions' => 0, 'hours' => 0, 'clients' => 0, 'missed' => 0, 'first' => null, 'last' => null],
            ]);
        }

        $query = TrainerPastSessions::query($profile, $filter);
        $page = $query->paginate(self::PER_PAGE, ['*'], 'pagina');

        // A page after the last one (old link): show the last one.
        if ($page->currentPage() > $page->lastPage()) {
            $page = $query->paginate(self::PER_PAGE, ['*'], 'pagina', $page->lastPage());
        }

        return Inertia::render('trainer/past-sessions', [
            'trainerArea' => $this->trainerArea(),
            'sessions' => $page->getCollection()->map(fn (Booking $booking) => TrainerPastSessions::row($booking))->values()->all(),
            'pagination' => ['currentPage' => $page->currentPage(), 'lastPage' => $page->lastPage()],
            'filter' => $filter ?? 'all',
            'counts' => TrainerPastSessions::counts($profile),
            'lastWeek' => TrainerPastSessions::lastWeek($profile),
        ]);
    }
}
