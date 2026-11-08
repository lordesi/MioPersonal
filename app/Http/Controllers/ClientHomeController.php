<?php

namespace App\Http\Controllers;

use App\Enums\BookingStatus;
use App\Enums\TrainingMode;
use App\Http\Requests\ClientPreferencesRequest;
use App\Models\Booking;
use App\Models\ClientPreference;
use App\Models\GroupSession;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Support\ClientBookingData;
use App\Support\GroupSessionCard;
use App\Support\NewsFeed;
use App\Support\TrainerCard;
use App\Support\TrainerSlots;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Le mie prenotazioni", the dashboard of the client area and the first page
 * after the login (docs/design/cliente-dashboard.html): the next session, the
 * other ones, the requests waiting for an answer, the sessions done (with the
 * review), the packages and the client's trainers. A new account sees every
 * section empty, and a few trainers to try instead of "I tuoi trainer".
 */
class ClientHomeController extends Controller
{
    private const RECOMMENDED = 3;

    public function __invoke(Request $request): Response
    {
        /** @var User $client */
        $client = $request->user();
        $preference = $client->clientPreference;

        // The suggested trainers show their first free slot.
        TrainerSlots::refreshStale();

        $bookings = $client->bookings()
            ->with(ClientBookingData::RELATIONS)
            ->orderBy('starts_at')
            ->get();

        // "Invita un amico": the sessions of others the client joined, still to come.
        $asGuest = Booking::query()
            ->withGuest($client)
            ->where('starts_at', '>', now())
            ->with(ClientBookingData::RELATIONS)
            ->get()
            ->filter(fn (Booking $booking) => $booking->status === BookingStatus::Confirmed || $booking->isPending());

        $upcoming = $bookings->concat($asGuest)
            ->filter(ClientBookingData::isUpcoming(...))
            ->sortBy('starts_at')
            ->values();
        $trainers = ClientBookingData::trainers($client, $bookings);
        // A friend doesn't answer the trainer's "Sposta": the booker does.
        $withGroup = fn (array $data, Booking $booking) => [
            ...$data,
            ...($booking->client_id === $client->id ? [] : ['proposal' => null]),
            'group' => ClientBookingData::group($booking, $client),
        ];

        return Inertia::render('client/home', [
            'firstName' => $client->first_name,
            // The first one is "La tua prossima seduta", the others "Più avanti".
            'upcoming' => $upcoming->map(fn (Booking $booking) => $withGroup(ClientBookingData::upcoming($booking), $booking))->all(),
            'pending' => $bookings->concat($asGuest->filter(fn (Booking $booking) => $booking->isPending()))
                ->filter(ClientBookingData::isPending(...))
                ->sortBy('starts_at')
                ->map(fn (Booking $booking) => $withGroup(ClientBookingData::pending($booking), $booking))
                ->values()->all(),
            // All of them: the page shows the last three, "Vedi tutte" the others.
            'past' => ClientBookingData::past($client, $bookings
                ->filter(ClientBookingData::isDone(...))
                ->sortByDesc('starts_at')
                ->values()),
            'packages' => ClientBookingData::packages($client),
            'trainers' => $trainers,
            // Only for a client without trainers yet: one query less for the others.
            'recommended' => $trainers === [] ? $this->recommended($client, $preference) : [],
            'hasPreferences' => $preference !== null,
            // "I miei eventi": the places taken, still to come (cancelled ones marked).
            'events' => GroupSessionCard::many(GroupSessionCard::load(GroupSession::query()
                ->whereHas('activeRegistrations', fn (Builder $registration) => $registration->where('user_id', $client->id))
                ->where('ends_at', '>', now()))
                ->orderBy('starts_at')
                ->get()),
            // "Novità" in the client's city (Italy without one).
            'news' => NewsFeed::preview($preference?->city, $client),
        ]);
    }

    /**
     * "Consigliati per te": published trainers that match the answers of
     * "Completa il tuo profilo", first free slot first. When the disciplines
     * or the budget leave fewer than three, the others in the same city and
     * mode fill the row. Favorites are left out: they have their own row.
     *
     * @return list<array<string, mixed>>
     */
    private function recommended(User $client, ?ClientPreference $preference): array
    {
        $base = TrainerProfile::query()
            ->published()
            ->with(TrainerCard::RELATIONS)
            ->whereNotIn('id', TrainerCard::favoriteIds($client))
            ->orderByRaw('next_free_slot_at is null')
            ->orderBy('next_free_slot_at')
            ->orderByDesc('rating_count')
            ->orderBy('id');

        if ($preference !== null) {
            $this->whereModeAndCity($base, $preference);
        }

        $disciplineIds = $preference->discipline_ids ?? [];
        $budget = $preference?->budget_max_cents;

        // The end of the slider is "Nessun limite".
        if ($budget !== null && $budget >= ClientPreferencesRequest::BUDGET_MAX_CENTS) {
            $budget = null;
        }

        /** @var Collection<int, TrainerProfile> $trainers */
        $trainers = (clone $base)
            ->when($disciplineIds !== [], fn (Builder $query) => $query
                ->whereHas('disciplines', fn (Builder $discipline) => $discipline->whereIn('disciplines.id', $disciplineIds)))
            ->when($budget !== null, fn (Builder $query) => $query->where('price_from_cents', '<=', $budget))
            ->limit(self::RECOMMENDED)
            ->get();

        if ($trainers->count() < self::RECOMMENDED) {
            $trainers = $trainers->concat((clone $base)
                ->whereNotIn('id', $trainers->modelKeys())
                ->limit(self::RECOMMENDED - $trainers->count())
                ->get());
        }

        return array_values($trainers->map(TrainerCard::from(...))->all());
    }

    /**
     * Same rules as the search: online-only trainers show up in every city,
     * and the city doesn't count for clients who only train online.
     *
     * @param  Builder<TrainerProfile>  $query
     */
    private function whereModeAndCity(Builder $query, ClientPreference $preference): void
    {
        match ($preference->mode) {
            TrainingMode::InPerson => $query->where('trains_in_person', true),
            TrainingMode::Online => $query->where('trains_online', true),
            default => null,
        };

        if ($preference->city_id !== null && $preference->mode !== TrainingMode::Online) {
            $query->where(fn (Builder $inCity) => $inCity
                ->where(fn (Builder $based) => $based->basedIn($preference->city_id))
                ->orWhere(fn (Builder $onlineOnly) => $onlineOnly->where('trains_online', true)->where('trains_in_person', false)));
        }
    }
}
