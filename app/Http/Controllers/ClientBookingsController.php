<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\GroupSession;
use App\Models\User;
use App\Support\ClientBookingData;
use App\Support\GroupSessionCard;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Le mie prenotazioni" (docs/design/cliente-dashboard.html): the next
 * session, the other ones, the requests waiting for an answer, the sessions
 * done (with the review), the packages and the client's trainers. The
 * client's "Panoramica" is ClientHomeController.
 */
class ClientBookingsController extends Controller
{
    public function __invoke(Request $request): Response
    {
        /** @var User $client */
        $client = $request->user();

        ['bookings' => $bookings, 'asGuest' => $asGuest] = ClientBookingData::load($client);

        $upcoming = ClientBookingData::upcomingOf($bookings, $asGuest);
        // A friend doesn't answer the trainer's "Sposta": the booker does.
        $withGroup = fn (array $data, Booking $booking) => [
            ...$data,
            ...($booking->client_id === $client->id ? [] : ['proposal' => null]),
            'group' => ClientBookingData::group($booking, $client),
        ];

        return Inertia::render('client/bookings', [
            'firstName' => $client->first_name,
            // The first one is "La tua prossima seduta", the others "Più avanti".
            'upcoming' => $upcoming->map(fn (Booking $booking) => $withGroup(ClientBookingData::upcoming($booking), $booking))->all(),
            'pending' => ClientBookingData::pendingOf($bookings, $asGuest)
                ->map(fn (Booking $booking) => $withGroup(ClientBookingData::pending($booking), $booking))
                ->all(),
            // All of them: the page shows the last three, "Vedi tutte" the others.
            'past' => ClientBookingData::past($client, $bookings
                ->filter(ClientBookingData::isDone(...))
                ->sortByDesc('starts_at')
                ->values()),
            'packages' => ClientBookingData::packages($client),
            'trainers' => ClientBookingData::trainers($client, $bookings),
            // "I miei eventi": the places taken, still to come (cancelled ones marked).
            'events' => GroupSessionCard::many(GroupSessionCard::load(GroupSession::query()
                ->whereHas('activeRegistrations', fn (Builder $registration) => $registration->where('user_id', $client->id))
                ->where('ends_at', '>', now()))
                ->orderBy('starts_at')
                ->get()),
        ]);
    }
}
