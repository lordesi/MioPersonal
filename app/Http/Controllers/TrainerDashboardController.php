<?php

namespace App\Http\Controllers;

use App\Enums\BookingStatus;
use App\Http\Controllers\Concerns\BuildsPlaceholderData;
use App\Models\Booking;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Support\ClientAttendance;
use App\Support\TrainerPastSessions;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Le tue prenotazioni", the trainer's dashboard: today's sessions, the next
 * ones, the last 7 days, the requests to answer and a few numbers. A new
 * trainer sees an empty dashboard.
 */
class TrainerDashboardController extends Controller
{
    use BuildsPlaceholderData;

    public function __invoke(Request $request): Response
    {
        /** @var User $trainer */
        $trainer = $request->user();
        $profile = $trainer->trainerProfile;

        return Inertia::render('trainer/today', [
            'firstName' => Str::before($trainer->name, ' '),
            'trainerArea' => $this->trainerArea(),
            // No profile yet (registration not sent): nothing to show.
            ...($profile === null ? ['today' => [], 'upcoming' => [], 'past' => [], 'requests' => [], 'stats' => ['sessionsThisWeek' => 0]] : $this->bookings($profile)),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function bookings(TrainerProfile $profile): array
    {
        $today = $this->romeNow()->startOfDay();
        $week = $today->startOfWeek();

        return [
            'today' => $profile->bookings()
                ->where('status', BookingStatus::Confirmed)
                ->whereBetween('starts_at', [$today->utc(), $today->addDay()->utc()])
                ->with('client')
                ->orderBy('starts_at')
                ->get()
                ->map(fn (Booking $booking) => $this->row($booking))
                ->all(),
            // "Prossime prenotazioni": every confirmed session from tomorrow on.
            'upcoming' => $profile->bookings()
                ->where('status', BookingStatus::Confirmed)
                ->where('starts_at', '>=', $today->addDay()->utc())
                ->with('client')
                ->orderBy('starts_at')
                ->get()
                ->map(fn (Booking $booking) => $this->row($booking))
                ->all(),
            // "Ultimi 7 giorni": over before today and still in time for "Saltata"
            // (today's are already in "Oggi"). "Vedi tutte" opens every one.
            'past' => TrainerPastSessions::query($profile)
                ->where('ends_at', '>', now()->subDays(Booking::NO_SHOW_DAYS))
                ->where('starts_at', '<', $today->utc())
                ->get()
                ->map(TrainerPastSessions::row(...))
                ->all(),
            'requests' => $this->requests($profile),
            'stats' => [
                'sessionsThisWeek' => $profile->bookings()
                    ->where('status', BookingStatus::Confirmed)
                    ->whereBetween('starts_at', [$week->utc(), $week->addWeek()->utc()])
                    ->count(),
            ],
        ];
    }

    /**
     * Waiting for an answer, the ones expiring first on top, with how often
     * the client shows up: it helps to decide.
     *
     * @return array<int, array<string, mixed>>
     */
    private function requests(TrainerProfile $profile): array
    {
        $requests = $profile->bookings()
            ->awaitingAnswer()
            ->with('client')
            ->orderBy('expires_at')
            ->get();
        $attendance = ClientAttendance::forClients($requests->pluck('client_id'), $profile);

        return $requests
            ->map(fn (Booking $booking) => [
                ...$this->row($booking),
                'note' => $booking->client_note,
                'expiresAt' => $booking->expires_at === null ? null : $this->iso($booking->expires_at),
                // null once the client deleted the account.
                'attendance' => $booking->client_id === null ? null : $attendance[$booking->client_id],
            ])
            ->values()
            ->all();
    }

    /**
     * @return array{id: int, clientId: int|null, clientName: string, start: string, hours: float, serviceName: string, placeLabel: string, noShow: bool}
     */
    private function row(Booking $booking): array
    {
        return [
            'id' => $booking->id,
            // For the link to the client's profile; null once the account is deleted.
            'clientId' => $booking->client_id,
            // Clients are told the trainer sees their first and last name.
            'clientName' => $booking->client->name ?? 'Account eliminato',
            'start' => $this->iso($booking->starts_at),
            'hours' => $booking->starts_at->diffInMinutes($booking->ends_at) / 60,
            'serviceName' => $booking->service_name,
            'placeLabel' => $booking->place_label,
            // Marked "Saltata" by the trainer; otherwise done once it ends.
            'noShow' => $booking->no_show_at !== null,
        ];
    }
}
