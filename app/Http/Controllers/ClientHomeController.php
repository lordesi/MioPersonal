<?php

namespace App\Http\Controllers;

use App\Enums\ActivityKind;
use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\TrainerClient;
use App\Models\User;
use App\Support\ClientBookingData;
use App\Support\ClientProgress;
use App\Support\NewsFeed;
use App\Support\RecommendedTrainers;
use App\Support\TrainerSlots;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Panoramica", the first page of the client area after the login: the next
 * session in short, what waits for an answer, the client's training week by
 * week, the trainers (or a few to try) and the news. The bookings themselves
 * are in "Le mie prenotazioni" (ClientBookingsController).
 */
class ClientHomeController extends Controller
{
    public function __invoke(Request $request): Response
    {
        /** @var User $client */
        $client = $request->user();
        $preference = $client->clientPreference;

        ['bookings' => $bookings, 'asGuest' => $asGuest] = ClientBookingData::load($client);

        $upcoming = ClientBookingData::upcomingOf($bookings, $asGuest);
        $trainers = ClientBookingData::trainers($client, $bookings);

        if ($trainers === []) {
            // The suggested trainers show their first free slot.
            TrainerSlots::refreshStale();
        }

        // "Nuovo orario proposto" (only the booker answers) and "Annullate dal trainer".
        $toAnswer = $upcoming->filter(fn (Booking $booking) => $booking->client_id === $client->id && $booking->proposal() !== null)->count()
            + ClientBookingData::pendingOf($bookings, $asGuest)
                ->filter(fn (Booking $booking) => $booking->status === BookingStatus::Cancelled)
                ->count();
        $next = $upcoming->first();

        return Inertia::render('client/home', [
            'firstName' => $client->first_name,
            'next' => $next === null ? null : ClientBookingData::upcoming($next),
            'toAnswer' => $toAnswer,
            'progress' => ClientProgress::for($client)->summary(),
            // Null without the consent to body data: the panel is not shown.
            'weights' => ClientProgress::weights($client),
            // "Segna un allenamento".
            'activityKinds' => array_map(fn (ActivityKind $kind) => ['value' => $kind->value, 'label' => $kind->label()], ActivityKind::cases()),
            'today' => now(ClientProgress::TIMEZONE)->format('Y-m-d'),
            'daysBack' => ClientProgressController::DAYS_BACK,
            // "Condividi i miei progressi", one switch per trainer.
            'sharing' => ClientSharingController::records($client)
                ->map(fn (TrainerClient $record) => [
                    'recordId' => $record->id,
                    'trainerName' => $record->trainerProfile->user->name,
                    'trainerFirstName' => $record->trainerProfile->user->first_name,
                    'shared' => $record->progress_shared_at !== null,
                ])->values()->all(),
            // The trainers' notes for the client, the most recent first.
            'notes' => TrainerClient::query()
                ->where('user_id', $client->id)
                ->whereNotNull('shared_note')
                ->with('trainerProfile.user')
                ->latest('shared_note_at')
                ->get()
                ->map(fn (TrainerClient $record) => [
                    'id' => $record->id,
                    'trainerName' => $record->trainerProfile->user->name,
                    'trainerHref' => route('trainers.show', $record->trainerProfile->slug, false),
                    'note' => $record->shared_note,
                    'at' => ClientBookingData::iso($record->shared_note_at ?? $record->updated_at ?? now()),
                ])->all(),
            'packages' => ClientBookingData::packages($client),
            'trainers' => $trainers,
            // Only for a client without trainers yet: one query less for the others.
            'recommended' => $trainers === [] ? RecommendedTrainers::for($client, $preference) : [],
            'hasPreferences' => $preference !== null,
            // "Novità" in the client's city (Italy without one).
            'news' => NewsFeed::preview($preference?->city, $client),
        ]);
    }
}
