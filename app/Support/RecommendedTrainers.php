<?php

namespace App\Support;

use App\Enums\TrainingMode;
use App\Http\Requests\ClientPreferencesRequest;
use App\Models\ClientPreference;
use App\Models\TrainerProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

/**
 * "Consigliati per te" in the client's "Panoramica": published trainers that
 * match the answers of "Completa il tuo profilo", first free slot first.
 */
final class RecommendedTrainers
{
    private const LIMIT = 3;

    /**
     * When the disciplines or the budget leave fewer than three, the others
     * in the same city and mode fill the row. Favorites are left out: they
     * have their own row. TrainerSummary, for the frontend.
     *
     * @return list<array<string, mixed>>
     */
    public static function for(User $client, ?ClientPreference $preference): array
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
            self::whereModeAndCity($base, $preference);
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
            ->limit(self::LIMIT)
            ->get();

        if ($trainers->count() < self::LIMIT) {
            $trainers = $trainers->concat((clone $base)
                ->whereNotIn('id', $trainers->modelKeys())
                ->limit(self::LIMIT - $trainers->count())
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
    private static function whereModeAndCity(Builder $query, ClientPreference $preference): void
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
