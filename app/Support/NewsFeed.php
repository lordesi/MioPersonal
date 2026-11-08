<?php

namespace App\Support;

use App\Enums\GroupSessionPlace;
use App\Models\City;
use App\Models\GroupSession;
use App\Models\GymProfile;
use App\Models\TrainerProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

/**
 * "Novità": trainers and gyms published in the last DAYS days, the newest
 * first, and the events published in the last DAYS days still to come, the
 * soonest first, for the page /novita and the previews in the home, the
 * client home and the searches. In a city: the trainers who work there in
 * person (and the online-only ones, as in the search), the gyms there, the
 * events there and online.
 */
final class NewsFeed
{
    /** "Nuovo" for this many days after the approval. */
    public const DAYS = 30;

    /** The previews: one row. */
    public const PREVIEW = 4;

    /**
     * @return list<array<string, mixed>> TrainerSummary, with the heart
     */
    public static function trainers(?City $city, int $limit, ?User $viewer = null): array
    {
        $favoriteIds = TrainerCard::favoriteIds($viewer);

        $profiles = TrainerProfile::query()
            ->published()
            ->where('approved_at', '>=', now()->subDays(self::DAYS))
            ->when($city !== null, fn (Builder $query) => $query->where(fn (Builder $inCity) => $inCity
                ->where(fn (Builder $based) => $based->basedIn($city->id))
                ->orWhere(fn (Builder $onlineOnly) => $onlineOnly->where('trains_online', true)->where('trains_in_person', false))))
            ->with(TrainerCard::RELATIONS)
            ->latest('approved_at')
            ->orderByDesc('id')
            ->limit($limit)
            ->get();

        return array_values($profiles->map(fn (TrainerProfile $profile) => [
            ...TrainerCard::from($profile),
            'favorite' => in_array($profile->id, $favoriteIds, true),
        ])->all());
    }

    /**
     * @return list<array<string, mixed>> GymSummary, with the heart
     */
    public static function gyms(?City $city, int $limit, ?User $viewer = null): array
    {
        $gyms = GymProfile::query()
            ->published()
            ->where('approved_at', '>=', now()->subDays(self::DAYS))
            ->when($city !== null, fn (Builder $query) => $query->where('city_id', $city->id))
            ->with(GymCard::RELATIONS)
            ->withCount('trainers')
            ->latest('approved_at')
            ->orderByDesc('id')
            ->limit($limit)
            ->get();

        return GymCard::many($gyms, GymCard::favoriteIds($viewer));
    }

    /**
     * @return list<array<string, mixed>> GroupSessionSummary
     */
    public static function events(?City $city, int $limit): array
    {
        $events = GroupSession::query()
            ->listed()
            ->upcoming()
            ->where('created_at', '>=', now()->subDays(self::DAYS))
            ->when($city !== null, fn (Builder $query) => $query->where(fn (Builder $here) => $here
                ->where('city_id', $city->id)
                ->orWhere('place', GroupSessionPlace::Online)));

        return GroupSessionCard::many(GroupSessionCard::load($events)->orderBy('starts_at')->limit($limit)->get());
    }

    /**
     * The preview of a page: a few of each, the city for the link.
     *
     * @return array{city: array{slug: string, name: string}|null, trainers: list<array<string, mixed>>, gyms: list<array<string, mixed>>, events: list<array<string, mixed>>}
     */
    public static function preview(?City $city, ?User $viewer, bool $trainers = true, bool $gyms = true, bool $events = true): array
    {
        return [
            'city' => $city === null ? null : ['slug' => $city->slug, 'name' => $city->name],
            'trainers' => $trainers ? self::trainers($city, self::PREVIEW, $viewer) : [],
            'gyms' => $gyms ? self::gyms($city, self::PREVIEW, $viewer) : [],
            'events' => $events ? self::events($city, self::PREVIEW) : [],
        ];
    }
}
