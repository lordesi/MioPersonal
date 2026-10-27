<?php

namespace App\Http\Controllers;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\User;
use App\Support\TrainerCard;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/** "Prenotazione inviata": shown to the client right after sending a booking request. */
class BookingSentController extends Controller
{
    public function __invoke(Request $request, Booking $booking): Response
    {
        /** @var User $client */
        $client = $request->user();

        // Someone else's booking: as if it didn't exist.
        abort_unless($booking->client_id === $client->id, 404);

        $booking->load(['trainerProfile.user', 'trainerProfile.city', 'trainerProfile.disciplines']);
        $trainer = $booking->trainerProfile;

        return Inertia::render('client/booking-sent', [
            'booking' => [
                'id' => $booking->id,
                // Already "confirmed" when the trainer confirms automatically.
                'status' => $booking->status === BookingStatus::Confirmed ? 'confirmed' : 'pending',
                'start' => $booking->starts_at->utc()->format('Y-m-d\TH:i:s\Z'),
                'hours' => $booking->starts_at->diffInMinutes($booking->ends_at) / 60,
                'serviceName' => $booking->service_name,
                'placeLabel' => $booking->place_label,
                'priceCents' => $booking->price_cents,
                'trainer' => [
                    'name' => $trainer->user->name,
                    'firstName' => $trainer->user->first_name,
                    'href' => route('trainers.show', $trainer->slug, false),
                    // "Functional e Pilates · Milano"
                    'subtitle' => $trainer->disciplines->pluck('name')->take(2)->implode(' e ').' · '.TrainerCard::cityLabel($trainer),
                ],
            ],
        ]);
    }
}
