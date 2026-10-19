<?php

namespace App\Http\Controllers;

use App\Actions\Bookings\CreateBooking;
use App\Enums\BookingActor;
use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\ClientPackage;
use App\Models\Service;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Support\TrainerSlots;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * The client's side of a booking: send the request from the profile page
 * and cancel it from "Le mie prenotazioni".
 */
class BookingController extends Controller
{
    /** The choice of the profile page, kept in the URL across login and sign-up. */
    private const CHOICE = ['servizio', 'durata', 'inizio'];

    /**
     * "Ti registri solo quando prenoti": guests land here, the `auth` middleware
     * sends them to login (or sign-up) and then back here, and from here to the
     * profile with their slot still chosen.
     */
    public function start(Request $request, string $slug): RedirectResponse
    {
        return redirect()->route('trainers.show', ['slug' => $slug, ...$request->only(self::CHOICE)]);
    }

    public function store(Request $request, string $slug, CreateBooking $createBooking): RedirectResponse
    {
        $profile = TrainerProfile::where('slug', $slug)->with('workingHours')->first();

        abort_if($profile === null || ! $profile->isApproved(), 404);

        /** @var User $client */
        $client = $request->user();

        // "Il tuo pacchetto": a session of a package bought from this trainer.
        if ($request->filled('client_package_id')) {
            $request->validate([
                'client_package_id' => [
                    'integer',
                    Rule::exists(ClientPackage::class, 'id')->where('client_id', $client->id)->where('trainer_profile_id', $profile->id),
                ],
                'start' => ['required', 'date'],
            ], [
                'client_package_id.*' => 'Questo pacchetto non è tuo o non è di questo trainer.',
                'start.*' => 'Scegli giorno e orario.',
            ]);

            $package = ClientPackage::findOrFail($request->integer('client_package_id'))
                // The profile already loaded, with its working hours.
                ->setRelation('trainerProfile', $profile);

            $booking = $createBooking->fromPackage(
                $client,
                $package,
                CarbonImmutable::parse($request->string('start')->value()),
            );

            return to_route('client.bookings.sent', $booking);
        }

        $request->validate([
            'service_id' => [
                'required', 'integer',
                Rule::exists(Service::class, 'id')->where('trainer_profile_id', $profile->id)->where('is_active', true),
            ],
            'start' => ['required', 'date'],
            'minutes' => ['required', 'integer'],
        ], [
            'service_id.*' => 'Scegli uno dei servizi del trainer.',
            'start.*' => 'Scegli giorno e orario.',
            'minutes.*' => 'Scegli la durata della seduta.',
        ]);

        $booking = $createBooking->handle(
            $client,
            $profile,
            Service::findOrFail($request->integer('service_id')),
            CarbonImmutable::parse($request->string('start')->value()),
            $request->integer('minutes'),
        );

        return to_route('client.bookings.sent', $booking);
    }

    /**
     * "Annulla la prenotazione": a request still waiting, or a confirmed session
     * not started yet. The card shows the result itself: no message on success.
     */
    public function cancel(Request $request, Booking $booking): RedirectResponse
    {
        /** @var User $client */
        $client = $request->user();

        // Someone else's booking: as if it didn't exist.
        abort_unless($booking->client_id === $client->id, 404);

        $cancellable = ($booking->isPending() || $booking->status === BookingStatus::Confirmed)
            && $booking->starts_at->isFuture();

        if (! $cancellable) {
            throw ValidationException::withMessages(['booking' => 'Questa prenotazione non si può più annullare.']);
        }

        $booking->cancel(BookingActor::Client, $client);
        TrainerSlots::refresh($booking->trainerProfile);

        return back();
    }
}
