<?php

namespace App\Support;

use App\Models\GymProfile;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

/**
 * "Palestre in tendenza" on the home: visits to the profile and new hearts
 * of the last days, as TrainerShelves for the trainers. With fewer than
 * MIN_GYMS the home shows "Palestre in evidenza" instead.
 */
final class GymShelves
{
    /** Below this many gyms "in tendenza" gives way to "in evidenza". */
    public const MIN_GYMS = 3;

    /** Gyms in the carousel (3 per page). */
    public const LIMIT = 9;

    /** "In tendenza" counts the activity of the last days. */
    public const TREND_DAYS = 14;

    /** Saving a gym says more than a visit. */
    private const FAVORITE_WEIGHT = 5;

    /**
     * The cards "in tendenza", or null when there are too few.
     *
     * @param  list<int>  $favoriteIds
     * @return list<array<string, mixed>>|null
     */
    public static function trending(array $favoriteIds = [], ?CarbonImmutable $now = null): ?array
    {
        $ids = self::trendingIds($now ?? CarbonImmutable::now());

        if (count($ids) < self::MIN_GYMS) {
            return null;
        }

        $gyms = GymProfile::query()
            ->with(GymCard::RELATIONS)
            ->withCount('trainers')
            ->whereIn('id', $ids)
            ->get()
            ->keyBy('id');

        return GymCard::many(
            array_values(array_map(fn (int $id) => $gyms[$id], array_filter($ids, fn (int $id) => $gyms->has($id)))),
            $favoriteIds,
        );
    }

    /**
     * Visits plus hearts of the last days, published gyms with a cover only
     * (as "in evidenza"): the ones with no activity are not "in tendenza".
     *
     * @return list<int>
     */
    public static function trendingIds(CarbonImmutable $now): array
    {
        $since = $now->subDays(self::TREND_DAYS);
        $published = GymProfile::query()->published()->whereHas('cover')->pluck('id')->all();

        $views = DB::table('gym_profile_views')
            ->where('day', '>=', $since->toDateString())
            ->whereIn('gym_profile_id', $published)
            ->groupBy('gym_profile_id')
            ->selectRaw('gym_profile_id, sum(views) as total')
            ->pluck('total', 'gym_profile_id');

        $favorites = DB::table('gym_favorites')
            ->where('created_at', '>=', $since)
            ->whereIn('gym_profile_id', $published)
            ->groupBy('gym_profile_id')
            ->selectRaw('gym_profile_id, count(*) as total')
            ->pluck('total', 'gym_profile_id');

        $scores = [];

        foreach ($published as $id) {
            $score = (int) ($views[$id] ?? 0) + self::FAVORITE_WEIGHT * (int) ($favorites[$id] ?? 0);

            if ($score > 0) {
                $scores[$id] = $score;
            }
        }

        arsort($scores);

        return array_map('intval', array_slice(array_keys($scores), 0, self::LIMIT));
    }
}
