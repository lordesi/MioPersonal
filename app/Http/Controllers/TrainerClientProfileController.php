<?php

namespace App\Http\Controllers;

use App\Enums\BookingStatus;
use App\Http\Controllers\Concerns\BuildsPlaceholderData;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The profile of a client, seen by a trainer. Only for trainers who received
 * at least one booking from this client: for everyone else it doesn't exist.
 * The contacts arrive only after a confirmed booking, like the trainer's.
 */
class TrainerClientProfileController extends Controller
{
    use BuildsPlaceholderData;

    public function __invoke(Request $request, User $client): Response
    {
        /** @var User $trainer */
        $trainer = $request->user();
        $bookings = $trainer->trainerProfile?->bookings()->where('client_id', $client->id);

        // 404 also for clients who exist: we don't tell who is on MioPersonal.
        abort_if($bookings === null || ! $bookings->exists(), 404);

        $confirmed = $bookings->clone()->where('status', BookingStatus::Confirmed);
        $nextSession = $confirmed->clone()->where('starts_at', '>', now())->orderBy('starts_at')->first();
        // The contacts are not sent at all before a confirmation: hiding them
        // in React only would leave them readable in the page data.
        $canSeeContacts = $confirmed->exists();

        return Inertia::render('trainer/client-profile', [
            'trainerArea' => $this->trainerArea(),
            'client' => [
                'id' => $client->id,
                'name' => $client->name,
                'firstName' => $client->first_name,
                'avatar' => $client->avatar,
                'joinedAt' => $client->created_at === null ? null : $this->iso($client->created_at->toImmutable()),
                'sessions' => $confirmed->count(),
                'nextSession' => $nextSession === null ? null : $this->iso($nextSession->starts_at),
                'contacts' => $canSeeContacts ? [
                    'email' => $client->email,
                    'phone' => $client->phone,
                ] : null,
            ],
        ]);
    }
}
