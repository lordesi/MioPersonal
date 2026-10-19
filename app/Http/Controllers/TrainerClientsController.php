<?php

namespace App\Http\Controllers;

use App\Enums\BookingStatus;
use App\Http\Controllers\Concerns\BuildsPlaceholderData;
use App\Models\Booking;
use App\Models\ClientPackage;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Support\ClientAttendance;
use App\Support\TrainerSessions;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Clienti" of the trainer: everyone with at least one confirmed session.
 * A client who booked several slots shows up once, with all of them, and
 * with the package still in progress. Requests still waiting for an answer
 * are in "Richieste", not here.
 */
class TrainerClientsController extends Controller
{
    use BuildsPlaceholderData;

    public function __invoke(Request $request): Response
    {
        /** @var User $trainer */
        $trainer = $request->user();
        $profile = $trainer->trainerProfile;

        return Inertia::render('trainer/clients', [
            'trainerArea' => $this->trainerArea(),
            // No profile yet (registration not sent): nobody could book.
            'clients' => $profile === null ? [] : $this->clients($profile),
        ]);
    }

    /**
     * The clients with the closest session first, then the others from the
     * most recent session.
     *
     * @return array<int, array<string, mixed>>
     */
    private function clients(TrainerProfile $profile): array
    {
        $now = CarbonImmutable::now();
        $bookings = $profile->bookings()
            ->where('status', BookingStatus::Confirmed)
            // Deleted accounts: the past sessions stay, but there is nobody to show.
            ->whereNotNull('client_id')
            ->with(TrainerSessions::WITH)
            ->orderBy('starts_at')
            ->get();
        $attendance = ClientAttendance::forClients($bookings->pluck('client_id'), $profile);
        $packages = $this->packages($profile);

        return $bookings
            ->groupBy('client_id')
            ->map(fn (Collection $bookings, int $clientId) => $this->client($bookings, $now, $attendance[$clientId], $packages->get($clientId)))
            ->sort(function (array $a, array $b) {
                if ($a['nextSession'] !== null || $b['nextSession'] !== null) {
                    // Who has a next session comes first, the closest one on top.
                    return [$a['nextSession'] === null, $a['nextSession']] <=> [$b['nextSession'] === null, $b['nextSession']];
                }

                return $b['lastSession'] <=> $a['lastSession'];
            })
            ->values()
            ->all();
    }

    /**
     * The package of each client not all done yet: the most recent one.
     *
     * @return Collection<int, ClientPackage> by client id
     */
    private function packages(TrainerProfile $profile): Collection
    {
        return $profile->clientPackages()
            ->bought()
            ->whereNotNull('client_id')
            ->withSessionCounts()
            ->oldest('bought_at')
            ->get()
            ->filter(fn (ClientPackage $package) => ($package->done_count ?? 0) < $package->sessions_total)
            // The last one of each client wins.
            ->keyBy('client_id');
    }

    /**
     * @param  Collection<int, Booking>  $bookings  of one client, in order
     * @param  array<string, mixed>  $attendance  from ClientAttendance
     * @return array<string, mixed>
     */
    private function client(Collection $bookings, CarbonImmutable $now, array $attendance, ?ClientPackage $package): array
    {
        // A group always has at least one booking.
        $first = $bookings->firstOrFail();
        $past = $bookings->filter(fn (Booking $booking) => $booking->ends_at <= $now);
        $last = $bookings->filter(fn (Booking $booking) => $booking->starts_at <= $now)->last();
        $upcoming = $bookings->filter(fn (Booking $booking) => $booking->starts_at > $now)->values();
        $next = $upcoming->first();

        return [
            'id' => $first->client_id,
            'name' => $first->client->name ?? '',
            'sessions' => $bookings->count(),
            'firstSession' => $this->iso($first->starts_at),
            'lastSession' => $last === null ? null : $this->iso($last->starts_at),
            'nextSession' => $next === null ? null : $this->iso($next->starts_at),
            // Under the name: what they book, from the most recent session.
            'lastService' => ($last ?? $first)->service_name,
            'upcomingCount' => $upcoming->count(),
            'done' => $past->whereNull('no_show_at')->count(),
            'missed' => $past->whereNotNull('no_show_at')->count(),
            'package' => $package === null ? null : [
                'name' => $package->name,
                'done' => $package->done_count ?? 0,
                'total' => $package->sessions_total,
            ],
            'attendance' => $attendance,
            // Every session still to come.
            'upcoming' => $upcoming->map(TrainerSessions::row(...))->all(),
        ];
    }
}
