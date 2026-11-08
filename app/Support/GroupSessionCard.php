<?php

namespace App\Support;

use App\Enums\GroupSessionPlace;
use App\Models\GroupSession;
use App\Models\GroupSessionHost;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

/**
 * An event in the format of the cards (GroupSessionSummary in
 * resources/js/types/event.ts): lists, profiles, "Novità", client home.
 */
final class GroupSessionCard
{
    /** What a card reads: load it with ::load() to avoid one query per card. */
    public const RELATIONS = ['city', 'discipline', 'gymProfile.city', 'hosts.trainerProfile.user', 'hosts.gymProfile'];

    /**
     * The relations and the count of the places taken.
     *
     * @param  Builder<GroupSession>  $query
     * @return Builder<GroupSession>
     */
    public static function load(Builder $query): Builder
    {
        return $query->with(self::RELATIONS)->withCount('activeRegistrations as registered_count');
    }

    /**
     * @return array<string, mixed>
     */
    public static function from(GroupSession $session): array
    {
        return [
            'id' => $session->id,
            'slug' => $session->slug,
            'href' => route('events.show', $session->slug, false),
            'title' => $session->title,
            'type' => $session->type->value,
            'typeLabel' => $session->type->label(),
            'start' => self::iso($session->starts_at),
            'end' => self::iso($session->ends_at),
            'city' => $session->city?->name,
            'online' => $session->place === GroupSessionPlace::Online,
            'place' => $session->placeLabel(),
            'coverUrl' => $session->coverUrl(),
            'discipline' => $session->discipline?->name,
            'price' => $session->priceLabel(),
            'capacity' => $session->capacity,
            'remaining' => $session->remainingSeats(),
            'cancelled' => $session->isCancelled(),
            'hosts' => $session->acceptedHosts()
                ->map(fn (GroupSessionHost $host) => ['name' => $host->name(), 'href' => $host->href()])
                ->values()
                ->all(),
        ];
    }

    /**
     * @param  iterable<GroupSession>  $sessions
     * @return list<array<string, mixed>>
     */
    public static function many(iterable $sessions): array
    {
        return array_values(Collection::make($sessions)->map(fn (GroupSession $session) => self::from($session))->all());
    }

    /** Dates go to the frontend in UTC; the browser shows them in Rome time. */
    public static function iso(\DateTimeInterface $date): string
    {
        return CarbonImmutable::instance($date)->utc()->format('Y-m-d\TH:i:s\Z');
    }
}
