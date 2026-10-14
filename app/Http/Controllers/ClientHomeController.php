<?php

namespace App\Http\Controllers;

use App\Enums\TrainingMode;
use App\Models\ClientPreference;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Support\ClientBookingData;
use App\Support\TrainerCard;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Home" of the client area, the first page after the login: the next session,
 * the requests waiting for an answer, the favorites and a few trainers to try.
 * The full lists stay in "Le mie prenotazioni" and "Preferiti".
 */
class ClientHomeController extends Controller
{
    private const RECOMMENDED = 3;

    public function __invoke(Request $request): Response
    {
        /** @var User $client */
        $client = $request->user();
        $preference = $client->clientPreference;

        $bookings = $client->bookings()
            ->with(['trainerProfile.user', 'trainerProfile.disciplines'])
            // Past sessions are only in "Le mie prenotazioni".
            ->where('ends_at', '>', now())
            ->orderBy('starts_at')
            ->get();

        $upcoming = $bookings->filter(ClientBookingData::isUpcoming(...));
        $next = $upcoming->first();

        return Inertia::render('client/home', [
            'firstName' => $client->first_name,
            'upcomingCount' => $upcoming->count(),
            'nextBooking' => $next === null ? null : ClientBookingData::upcoming($next),
            'pending' => $bookings
                ->filter(ClientBookingData::isPending(...))
                ->map(ClientBookingData::pending(...))
                ->values()->all(),
            'favorites' => ClientBookingData::favorites($client),
            'recommended' => $this->recommended($client, $preference),
            'hasPreferences' => $preference !== null,
            // "Prenota una seduta" opens the search in the client's city (not a switched-off one: 404).
            'citySlug' => $preference?->city?->is_active ? $preference->city->slug : null,
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
                ->where('city_id', $preference->city_id)
                ->orWhereHas('otherCities', fn (Builder $other) => $other->whereKey($preference->city_id))
                ->orWhere(fn (Builder $onlineOnly) => $onlineOnly->where('trains_online', true)->where('trains_in_person', false)));
        }
    }
}
