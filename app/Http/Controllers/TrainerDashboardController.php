<?php

namespace App\Http\Controllers;

use App\Enums\BookingStatus;
use App\Http\Controllers\Concerns\BuildsPlaceholderData;
use App\Models\Booking;
use App\Models\ClientPackage;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Support\TrainerBookingRequests;
use App\Support\TrainerPastSessions;
use App\Support\TrainerSessions;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Panoramica", the trainer's dashboard: the next session, the agenda of the
 * next 7 days, the requests to answer, the active packages and the last 7
 * days. A new trainer sees an empty dashboard.
 */
class TrainerDashboardController extends Controller
{
    use BuildsPlaceholderData;

    /** Days of the agenda, today included. */
    public const AGENDA_DAYS = 7;

    /** Requests in the summary: the others are in "Richieste". */
    public const REQUESTS_PREVIEW = 3;

    public function __invoke(Request $request): Response
    {
        /** @var User $trainer */
        $trainer = $request->user();
        $profile = $trainer->trainerProfile;

        return Inertia::render('trainer/today', [
            'firstName' => Str::before($trainer->name, ' '),
            'trainerArea' => $this->trainerArea(),
            // No profile yet (registration not sent): nothing to show.
            ...($profile === null ? self::empty() : $this->dashboard($profile)),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private static function empty(): array
    {
        return [
            'next' => null,
            'agenda' => [],
            'requests' => [],
            'packages' => [],
            'past' => [],
            'stats' => ['pending' => 0, 'weekSessions' => 0],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function dashboard(TrainerProfile $profile): array
    {
        $today = $this->romeNow()->startOfDay();

        // Confirmed and waiting, from today to the 7th day.
        $agenda = $profile->bookings()
            ->active()
            ->whereBetween('starts_at', [$today->utc(), $today->addDays(self::AGENDA_DAYS)->utc()])
            ->with(TrainerSessions::WITH)
            ->orderBy('starts_at')
            ->get();

        $next = $profile->bookings()
            ->where('status', BookingStatus::Confirmed)
            ->where('ends_at', '>', now())
            ->with(TrainerSessions::WITH)
            ->orderBy('starts_at')
            ->first();

        return [
            // The one going on now, or the next one.
            'next' => $next === null ? null : TrainerSessions::row($next),
            'agenda' => $agenda->map(TrainerSessions::row(...))->values()->all(),
            'requests' => TrainerBookingRequests::rows(
                TrainerBookingRequests::query($profile)->limit(self::REQUESTS_PREVIEW)->get(),
                $profile,
            ),
            'packages' => $this->packages($profile),
            // "Ultimi 7 giorni": over before today and still in time for "Saltata".
            // "Vedi tutte" opens every one.
            'past' => TrainerPastSessions::query($profile)
                ->where('ends_at', '>', now()->subDays(Booking::NO_SHOW_DAYS))
                ->where('starts_at', '<', $today->utc())
                ->get()
                ->map(TrainerPastSessions::row(...))
                ->all(),
            'stats' => [
                'pending' => TrainerBookingRequests::query($profile)->count(),
                // "Sedute nei prossimi 7 giorni": only the confirmed ones.
                'weekSessions' => $agenda->where('status', BookingStatus::Confirmed)->count(),
            ],
        ];
    }

    /**
     * "Pacchetti attivi": bought and not all done yet, with the next session.
     *
     * @return list<array<string, mixed>>
     */
    private function packages(TrainerProfile $profile): array
    {
        /** @var Collection<int, ClientPackage> $packages */
        $packages = $profile->clientPackages()
            ->bought()
            // Deleted accounts: nobody to show.
            ->whereNotNull('client_id')
            ->withSessionCounts()
            ->with(['client', 'bookings' => fn ($bookings) => $bookings->active()->where('ends_at', '>', now())->orderBy('starts_at')])
            ->oldest('bought_at')
            ->get();

        return array_values($packages
            ->filter(fn (ClientPackage $package) => ($package->done_count ?? 0) < $package->sessions_total)
            ->map(function (ClientPackage $package) {
                /** @var Booking|null $next */
                $next = $package->bookings->first();

                return [
                    'id' => $package->id,
                    'clientId' => $package->client_id,
                    'clientName' => $package->client->name ?? '',
                    'name' => $package->name,
                    'total' => $package->sessions_total,
                    'done' => $package->done_count ?? 0,
                    'booked' => $package->bookedCount(),
                    'nextStart' => $next === null ? null : $this->iso($next->starts_at),
                ];
            })
            ->all());
    }
}
