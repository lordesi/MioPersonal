<?php

namespace App\Http\Controllers;

use App\Enums\BookingStatus;
use App\Http\Controllers\Concerns\BuildsPlaceholderData;
use App\Models\Booking;
use App\Models\TrainerProfile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Oggi", the trainer's dashboard: today's sessions, the requests to answer
 * and a few numbers. A new trainer sees an empty dashboard.
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
            ...($profile === null ? ['today' => [], 'requests' => [], 'stats' => ['sessionsThisWeek' => 0]] : $this->bookings($profile)),
            // Pending requests and sessions to mark are added by the page itself.
            'todos' => [],
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
            // Waiting for an answer, the ones expiring first on top.
            'requests' => $profile->bookings()
                ->awaitingAnswer()
                ->with('client')
                ->orderBy('expires_at')
                ->get()
                ->map(fn (Booking $booking) => [
                    ...$this->row($booking),
                    'note' => $booking->client_note,
                    'expiresAt' => $booking->expires_at === null ? null : $this->iso($booking->expires_at),
                ])
                ->all(),
            'stats' => [
                'sessionsThisWeek' => $profile->bookings()
                    ->where('status', BookingStatus::Confirmed)
                    ->whereBetween('starts_at', [$week->utc(), $week->addWeek()->utc()])
                    ->count(),
            ],
        ];
    }

    /**
     * @return array{id: int, clientId: int|null, clientName: string, start: string, hours: float, serviceName: string, placeLabel: string}
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
        ];
    }
}
