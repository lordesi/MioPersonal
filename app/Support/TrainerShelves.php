<?php

namespace App\Support;

use App\Enums\BookingStatus;
use App\Models\TrainerProfile;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

/**
 * The extra shelves of the home: "In tendenza", "Nuovi" and "Liberi oggi".
 *
 * A shelf with fewer than MIN_TRAINERS trainers is not shown at all: three
 * trainers fill one page of the carousel, fewer would look empty or made up.
 */
final class TrainerShelves
{
    /** Below this many trainers a shelf disappears. The only knob. */
    public const MIN_TRAINERS = 3;

    /** Trainers per shelf (the carousel shows 3 per page). */
    public const LIMIT = 9;

    /** "In tendenza" counts the activity of the last days. */
    public const TREND_DAYS = 14;

    /** A booking request says more than a visit. */
    private const BOOKING_WEIGHT = 5;

    /** "Nuovi": approved in the last days. */
    public const NEW_DAYS = 30;

    /**
     * @param  list<int>  $favoriteIds
     * @return list<array{key: string, title: string, trainers: list<array<string, mixed>>}>
     */
    public static function all(array $favoriteIds = [], ?CarbonImmutable $now = null): array
    {
        $now ??= CarbonImmutable::now();

        $shelves = [
            ['key' => 'trending', 'title' => 'Trainer in tendenza', 'ids' => self::trendingIds($now)],
            ['key' => 'available-today', 'title' => 'Liberi oggi', 'ids' => self::availableTodayIds($now)],
            ['key' => 'new', 'title' => 'Nuovi su MioPersonal', 'ids' => self::newIds($now)],
        ];

        $shelves = array_values(array_filter($shelves, fn (array $shelf) => count($shelf['ids']) >= self::MIN_TRAINERS));

        if ($shelves === []) {
            return [];
        }

        $profiles = TrainerProfile::query()
            ->published()
            ->with(TrainerCard::RELATIONS)
            ->whereIn('id', array_merge(...array_column($shelves, 'ids')))
            ->get()
            ->keyBy('id');

        return array_map(fn (array $shelf) => [
            'key' => $shelf['key'],
            'title' => $shelf['title'],
            'trainers' => array_values(array_map(
                fn (int $id) => [
                    ...TrainerCard::from($profiles[$id]),
                    'favorite' => in_array($id, $favoriteIds, true),
                ],
                array_values(array_filter($shelf['ids'], fn (int $id) => $profiles->has($id))),
            )),
        ], $shelves);
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

    /**
     * A free slot in the next 24 hours, the soonest first.
     *
     * @return list<int>
     */
    public static function availableTodayIds(CarbonImmutable $now): array
    {
        return TrainerProfile::query()
            ->published()
            ->whereNotNull('next_free_slot_at')
            ->where('next_free_slot_at', '>=', $now)
            ->where('next_free_slot_at', '<=', $now->addDay())
            ->orderBy('next_free_slot_at')
            ->limit(self::LIMIT)
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    /**
     * @return list<int>
     */
    public static function newIds(CarbonImmutable $now): array
    {
        return TrainerProfile::query()
            ->published()
            ->where('approved_at', '>=', $now->subDays(self::NEW_DAYS))
            ->latest('approved_at')
            ->limit(self::LIMIT)
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }
}
