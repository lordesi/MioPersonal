<?php

namespace App\Http\Controllers;

use App\Enums\BookingStatus;
use App\Http\Controllers\Concerns\BuildsPlaceholderData;
use App\Models\Booking;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Support\ClientAttendance;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Clienti" of the trainer: everyone with at least one confirmed session.
 * A client who booked several slots shows up once, with all of them.
 * Requests still waiting for an answer are in "Oggi", not here.
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
            ->with('client')
            ->orderBy('starts_at')
            ->get();
        $attendance = ClientAttendance::forClients($bookings->pluck('client_id'), $profile);

        return $bookings
            ->groupBy('client_id')
            ->map(fn (Collection $bookings, int $clientId) => $this->client($bookings, $now, $attendance[$clientId]))
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
     * @param  Collection<int, Booking>  $bookings  of one client, in order
     * @param  array<string, mixed>  $attendance  from ClientAttendance
     * @return array{id: int|null, name: string, sessions: int, lastSession: string|null, nextSession: string|null, attendance: array<string, mixed>, upcoming: array<int, array<string, mixed>>, recent: array<int, array<string, mixed>>}
     */
    private function client(Collection $bookings, CarbonImmutable $now, array $attendance): array
    {
        // A group always has at least one booking.
        $first = $bookings->firstOrFail();
        $last = $bookings->filter(fn (Booking $booking) => $booking->starts_at <= $now)->last();
        $upcoming = $bookings->filter(fn (Booking $booking) => $booking->starts_at > $now)->values();
        $next = $upcoming->first();
        $name = $first->client->name ?? '';

        return [
            'id' => $first->client_id,
            'name' => $name,
            'sessions' => $bookings->count(),
            'lastSession' => $last === null ? null : $this->iso($last->starts_at),
            'nextSession' => $next === null ? null : $this->iso($next->starts_at),
            'attendance' => $attendance,
            // Every slot still to come, in the format of the sessions of "Oggi".
            'upcoming' => $upcoming->map(fn (Booking $booking) => $this->session($booking, $name))->all(),
            // Over, and still in time for "Saltata": the most recent first.
            'recent' => $bookings
                ->filter(fn (Booking $booking) => $booking->canChangeNoShow())
                ->reverse()
                ->map(fn (Booking $booking) => $this->session($booking, $name))
                ->values()
                ->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function session(Booking $booking, string $clientName): array
    {
        return [
            'id' => $booking->id,
            'clientId' => $booking->client_id,
            'clientName' => $clientName,
            'start' => $this->iso($booking->starts_at),
            'hours' => $booking->starts_at->diffInMinutes($booking->ends_at) / 60,
            'serviceName' => $booking->service_name,
            'placeLabel' => $booking->place_label,
            'noShow' => $booking->no_show_at !== null,
        ];
    }
}
