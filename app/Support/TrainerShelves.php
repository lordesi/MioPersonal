<?php

namespace App\Support;

use App\Enums\BookingStatus;
use App\Models\TrainerProfile;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

/**
 * "Trainer in tendenza" on the home: visits and booking requests of the last
 * days. With fewer than MIN_TRAINERS the home shows "Trainer in evidenza"
 * (the best rated) instead: three trainers fill one page of the carousel,
 * fewer would look empty or made up.
 */
final class TrainerShelves
{
    /** Below this many trainers "in tendenza" gives way to "in evidenza". */
    public const MIN_TRAINERS = 3;

    /** Trainers in the carousel (3 per page). */
    public const LIMIT = 9;

    /** "In tendenza" counts the activity of the last days. */
    public const TREND_DAYS = 14;

    /** A booking request says more than a visit. */
    private const BOOKING_WEIGHT = 5;

    /**
     * The cards "in tendenza", or null when there are too few.
     *
     * @param  list<int>  $favoriteIds
     * @return list<array<string, mixed>>|null
     */
    public static function trending(array $favoriteIds = [], ?CarbonImmutable $now = null): ?array
    {
        $ids = self::trendingIds($now ?? CarbonImmutable::now());

        if (count($ids) < self::MIN_TRAINERS) {
            return null;
        }

        $profiles = TrainerProfile::query()
            ->published()
            ->with(TrainerCard::RELATIONS)
            ->whereIn('id', $ids)
            ->get()
            ->keyBy('id');

        return array_map(
            fn (int $id) => [
                ...TrainerCard::from($profiles[$id]),
                'favorite' => in_array($id, $favoriteIds, true),
            ],
            array_values(array_filter($ids, fn (int $id) => $profiles->has($id))),
        );
    }

    /**
     * Visits plus booking requests of the last days: the ones with no activity
     * are not "in tendenza".
     *
     * @return list<int>
     */
    public static function trendingIds(CarbonImmutable $now): array
    {
        $since = $now->subDays(self::TREND_DAYS);
        $published = TrainerProfile::query()->published()->pluck('id')->all();

        $views = DB::table('trainer_profile_views')
            ->where('day', '>=', $since->toDateString())
            ->whereIn('trainer_profile_id', $published)
            ->groupBy('trainer_profile_id')
            ->selectRaw('trainer_profile_id, sum(views) as total')
            ->pluck('total', 'trainer_profile_id');

        $requests = DB::table('bookings')
            ->where('created_at', '>=', $since)
            ->whereNotIn('status', [BookingStatus::Declined->value, BookingStatus::Expired->value])
            ->whereIn('trainer_profile_id', $published)
            ->groupBy('trainer_profile_id')
            ->selectRaw('trainer_profile_id, count(*) as total')
            ->pluck('total', 'trainer_profile_id');

        $scores = [];

        foreach ($published as $id) {
            $score = (int) ($views[$id] ?? 0) + self::BOOKING_WEIGHT * (int) ($requests[$id] ?? 0);

            if ($score > 0) {
                $scores[$id] = $score;
            }
        }

        arsort($scores);

        return array_map('intval', array_slice(array_keys($scores), 0, self::LIMIT));
    }
}
