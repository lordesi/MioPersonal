<?php

namespace App\Http\Controllers;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\User;
use App\Support\ClientBookingData;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Profilo" of the client area: the card to edit the profile, then the
 * client's activity (bookings, packages, favorites), the account and the
 * help, and "Esci". The favorites' number comes with `auth.favoritesCount`.
 */
class ClientProfileController extends Controller
{
    public function __invoke(Request $request): Response
    {
        /** @var User $client */
        $client = $request->user();

        return Inertia::render('client/profile', [
            // "Le mie prenotazioni · 3": the confirmed ones to come, own and as a friend.
            'upcomingCount' => Booking::query()
                ->where(fn (Builder $mine) => $mine
                    ->where('client_id', $client->id)
                    ->orWhere(fn (Builder $guest) => $guest->withGuest($client)))
                ->where('status', BookingStatus::Confirmed)
                ->where('ends_at', '>', now())
                ->count(),
            // "Pacchetti · 1 attivo": the bought ones not all done yet.
            'activePackages' => count(ClientBookingData::packages($client)),
        ]);
    }
}
