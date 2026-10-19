<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Review;
use App\Models\User;
use App\Support\ClientBookingData;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * "Lascia una recensione" under a session done, in "Le mie prenotazioni":
 * one per session (docs/database/analisi.md §3.7). It shows up on the
 * trainer's profile right away; phone numbers, links and emails are flagged
 * for the team (Admin · Recensioni).
 */
class ClientReviewController extends Controller
{
    public const TEXT_MAX = 1000;

    public function store(Request $request, Booking $booking): RedirectResponse
    {
        /** @var User $client */
        $client = $request->user();

        // Someone else's booking: as if it didn't exist.
        abort_unless($booking->client_id === $client->id, 404);

        if (! ClientBookingData::canBeReviewed($booking)) {
            throw ValidationException::withMessages(['review' => 'Puoi lasciare una recensione solo dopo una seduta svolta.']);
        }

        if (Review::where('booking_id', $booking->id)->exists()) {
            throw ValidationException::withMessages(['review' => 'Hai già lasciato una recensione per questa seduta.']);
        }

        $data = $request->validate([
            'rating' => ['required', 'integer', 'between:1,5'],
            'text' => ['required', 'string', 'max:'.self::TEXT_MAX],
        ], [
            'rating.*' => 'Scegli da 1 a 5 stelle.',
            'text.required' => 'Racconta in poche parole com’è andata.',
            'text.max' => 'Al massimo '.self::TEXT_MAX.' caratteri.',
        ]);

        $text = trim($data['text']);

        $review = new Review([
            'booking_id' => $booking->id,
            'client_id' => $client->id,
            'rating' => $data['rating'],
            'text' => $text,
        ]);
        $review->trainer_profile_id = $booking->trainer_profile_id;
        $review->flag_reason = self::flagReason($text);
        $review->save();

        $booking->trainerProfile->refreshRating();

        return back();
    }

    /**
     * Contacts in a public review break the rules of the platform: the team
     * checks them. Null when there is nothing to check.
     */
    private static function flagReason(string $text): ?string
    {
        return match (true) {
            (bool) preg_match('/[\w.+-]+@[\w-]+\.[\w.]+/u', $text) => 'Contiene un indirizzo email',
            (bool) preg_match('/(https?:\/\/|www\.)\S+/iu', $text) => 'Contiene un link',
            // Nine digits or more, with spaces, dots or dashes in between: a phone number.
            (bool) preg_match('/(\+?\d[\s.\-]?){9,}/u', $text) => 'Contiene un numero di telefono',
            default => null,
        };
    }
}
