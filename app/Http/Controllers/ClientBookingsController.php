<?php

namespace App\Http\Controllers;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\User;
use App\Support\ClientBookingData;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Le mie prenotazioni": the logged-in client's sessions, split as in the
 * design. A new account sees every section empty.
 */
class ClientBookingsController extends Controller
{
    /** "Passate": the most recent ones are enough. */
    private const PAST_LIMIT = 20;

    public function __invoke(Request $request): Response
    {
        /** @var User $client */
        $client = $request->user();

        $bookings = $client->bookings()
            ->with(['trainerProfile.user', 'trainerProfile.disciplines'])
            ->orderBy('starts_at')
            ->get();

        return Inertia::render('client/bookings', [
            'upcoming' => $bookings
                ->filter(ClientBookingData::isUpcoming(...))
                ->map(ClientBookingData::upcoming(...))
                ->values()->all(),
            'pending' => $bookings
                ->filter(ClientBookingData::isPending(...))
                ->map(ClientBookingData::pending(...))
                ->values()->all(),
            // TODO: packages bought by the client (`client_packages`, next step).
            'packages' => [],
            'favorites' => ClientBookingData::favorites($client),
            'past' => $bookings
                ->filter(fn (Booking $booking) => $booking->status === BookingStatus::Confirmed && ! $booking->ends_at->isFuture())
                ->sortByDesc('starts_at')
                ->take(self::PAST_LIMIT)
                ->map(fn (Booking $booking) => [
                    ...ClientBookingData::trainer($booking),
                    'id' => $booking->id,
                    'start' => ClientBookingData::iso($booking->starts_at),
                    'serviceName' => $booking->service_name,
                    // TODO: the client's review, once the `reviews` table exists.
                    'review' => null,
                ])->values()->all(),
        ]);
    }
}
