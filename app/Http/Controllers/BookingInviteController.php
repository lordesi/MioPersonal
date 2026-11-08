<?php

namespace App\Http\Controllers;

use App\Enums\BookingGuestStatus;
use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\BookingGuest;
use App\Models\Service;
use App\Models\User;
use App\Notifications\GuestJoined;
use App\Support\ClientBookingData;
use App\Support\Seo;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Invita un amico": the booker of a session for more people shares a link
 * (/invito/{token}); a friend opens it, signs in and joins. The slot stays
 * the booker's: the link is the only way in. From "Le mie prenotazioni" the
 * booker changes how many people come, takes a friend off or makes a new
 * link; a friend can leave.
 */
class BookingInviteController extends Controller
{
    public const NO_SEATS = 'I posti di questa seduta sono già tutti presi.';

    /** The page of the link: public, the session and the share of each one. */
    public function show(Request $request, string $token): Response
    {
        $booking = $this->booking($token);

        /** @var User|null $viewer */
        $viewer = $request->user();
        $trainer = $booking->trainerProfile;

        return Inertia::render('public/invite', [
            // A private link: never in the search engines.
            'seo' => Seo::page('Invito a una seduta', 'Un amico ti invita ad allenarvi insieme su MioPersonal.', index: false),
            'token' => $token,
            'invite' => [
                'bookerFirstName' => $booking->client->first_name ?? 'Un amico',
                'trainerName' => $trainer->user->name,
                'trainerHref' => route('trainers.show', $trainer->slug, false),
                'serviceName' => $booking->service_name,
                'start' => ClientBookingData::iso($booking->starts_at),
                'hours' => $booking->starts_at->diffInMinutes($booking->ends_at) / 60,
                'placeLabel' => $booking->place_label,
                'people' => $booking->people,
                'priceCents' => $booking->price_cents,
                'freeSeats' => $booking->freeSeats(),
                // Else still waiting for the trainer's answer.
                'confirmed' => $booking->status === BookingStatus::Confirmed,
            ],
            // What the viewer can do: join, already in, the booker's own link, or nothing.
            'state' => $this->state($booking, $viewer),
        ]);
    }

    /** "Accedi per partecipare": guests go through login or sign-up, then back to the link. */
    public function start(string $token): RedirectResponse
    {
        return to_route('bookings.invite', $token);
    }

    /** "Partecipo": a place of the session, until they are all taken. */
    public function join(Request $request, string $token): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        $guest = DB::transaction(function () use ($token, $user) {
            // One friend at a time: two can't take the last place.
            $booking = Booking::where('invite_token', $token)->lockForUpdate()->first();

            abort_if($booking === null, 404);

            $state = $this->state($booking, $user);

            if ($state !== 'can-join') {
                throw ValidationException::withMessages(['invite' => match ($state) {
                    'booker' => 'Questa è la tua prenotazione: condividi il link con i tuoi amici.',
                    'trainer' => 'Sei il trainer di questa seduta.',
                    'joined' => 'Partecipi già a questa seduta.',
                    'full' => self::NO_SEATS,
                    default => 'Questa seduta non accetta più partecipanti.',
                }]);
            }

            return BookingGuest::updateOrCreate(
                ['booking_id' => $booking->id, 'user_id' => $user->id],
                ['status' => BookingGuestStatus::Joined],
            );
        });

        $booking = $guest->booking;
        $booking->client?->notify(new GuestJoined($booking, $user));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Ci sei! Trovi la seduta in Le mie prenotazioni.']);

        return to_route('bookings.invite', $token);
    }

    /**
     * "Esci" for the friend, "Rimuovi" for the booker: the place is free
     * again for another friend with the link.
     */
    public function removeGuest(Request $request, Booking $booking, BookingGuest $guest): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        abort_unless($guest->booking_id === $booking->id, 404);

        $isBooker = $booking->client_id === $user->id;
        $isGuest = $guest->user_id === $user->id;

        abort_unless($isBooker || $isGuest, 404);

        if ($guest->status === BookingGuestStatus::Joined) {
            $guest->update(['status' => $isGuest ? BookingGuestStatus::Left : BookingGuestStatus::Removed]);
        }

        return back();
    }

    /**
     * "Quante persone": the booker changes it while cancelling is free, not
     * under the friends who already joined. The total follows the trainer's prices.
     */
    public function changePeople(Request $request, Booking $booking): RedirectResponse
    {
        /** @var User $client */
        $client = $request->user();

        abort_unless($booking->client_id === $client->id, 404);

        $request->validate(['people' => ['required', 'integer', 'between:1,'.Service::MAX_PEOPLE]], [
            'people.*' => 'Scegli quante persone vengono.',
        ]);
        $people = $request->integer('people');

        DB::transaction(function () use ($booking, $people) {
            $booking = Booking::whereKey($booking->id)->lockForUpdate()->firstOrFail();
            $service = $booking->service_id === null ? null : Service::find($booking->service_id);
            $price = $service?->priceFor($people);

            if ($booking->client_package_id !== null || ! $booking->canBeCancelledByClient() || $price === null) {
                throw ValidationException::withMessages(['people' => 'Per questa seduta non puoi più cambiare il numero di persone.']);
            }

            $joined = $booking->guests()->joined()->count();

            if ($people - 1 < $joined) {
                throw ValidationException::withMessages(['people' => $joined === 1
                    ? 'Un amico partecipa già: toglilo prima di scendere a meno persone.'
                    : "{$joined} amici partecipano già: togline qualcuno prima di scendere a meno persone."]);
            }

            $booking->forceFill([
                'people' => $people,
                'price_cents' => $price,
                'invite_token' => $people > 1 ? ($booking->invite_token ?? Booking::newInviteToken()) : null,
            ])->save();
        });

        return back();
    }

    /** "Nuovo link": the old one stops working; who already joined stays. */
    public function regenerate(Request $request, Booking $booking): RedirectResponse
    {
        /** @var User $client */
        $client = $request->user();

        abort_unless($booking->client_id === $client->id && $booking->acceptsGuests(), 404);

        $booking->forceFill(['invite_token' => Booking::newInviteToken()])->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Nuovo link creato: quello vecchio non funziona più.']);

        return back();
    }

    private function booking(string $token): Booking
    {
        $booking = Booking::where('invite_token', $token)
            ->with(['client', 'trainerProfile.user', 'guests'])
            ->first();

        abort_if($booking === null, 404);

        return $booking;
    }

    /**
     * 'can-join', 'login' (a guest of the site), 'booker', 'trainer',
     * 'joined', 'full', or 'closed' (over, cancelled, refused).
     */
    private function state(Booking $booking, ?User $viewer): string
    {
        return match (true) {
            $viewer !== null && $viewer->id === $booking->client_id => 'booker',
            $viewer !== null && $viewer->id === $booking->trainerProfile->user_id => 'trainer',
            $viewer !== null && $booking->guests()->joined()->where('user_id', $viewer->id)->exists() => 'joined',
            ! $booking->acceptsGuests() => 'closed',
            $booking->freeSeats() === 0 => 'full',
            $viewer === null => 'login',
            default => 'can-join',
        };
    }
}
