<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * "Cosa vuoi allenare?" of the home: the disciplines searched the most in the
 * trainers' search of the last 30 days first, then the others in the team's
 * order. With too few searches the team's order stays as it is.
 */
class PopularDisciplines
{
    public const DAYS = 30;

    /** Searches with a discipline needed before the order changes. */
    public const MIN_SEARCHES = 20;

    private const CACHE_KEY = 'home.popular-disciplines';

    /**
     * The active disciplines (CatalogOptions::disciplines()), reordered.
     *
     * @param  list<array{value: string, label: string}>  $disciplines
     * @return list<array{value: string, label: string}>
     */
    public static function order(array $disciplines): array
    {
        $counts = self::counts();

        if (array_sum($counts) < self::MIN_SEARCHES) {
            return $disciplines;
        }

        $position = array_flip(array_column($disciplines, 'value'));

        usort($disciplines, fn (array $a, array $b) => [
            -($counts[$a['value']] ?? 0), $position[$a['value']],
        ] <=> [
            -($counts[$b['value']] ?? 0), $position[$b['value']],
        ]);

        return $disciplines;
    }

    /**
     * slug => how many searches asked for it. Computed once a day.
     *
     * @return array<string, int>
     */
    public static function counts(): array
    {
        return Cache::remember(self::CACHE_KEY, now()->addDay(), function () {
            $counts = [];

            DB::table('search_logs')
                ->where('kind', 'trainer')
                ->where('created_at', '>=', now()->subDays(self::DAYS))
                ->where('disciplines', '!=', '[]')
                ->orderBy('id')
                ->select(['id', 'disciplines'])
                ->chunkById(1000, function ($rows) use (&$counts) {
                    foreach ($rows as $row) {
                        foreach (json_decode((string) $row->disciplines, true) ?: [] as $slug) {
                            if (is_string($slug)) {
                                $counts[$slug] = ($counts[$slug] ?? 0) + 1;
                            }
                        }
                    }
                });

            return $counts;
        });
    }

    public static function forget(): void
    {
        Cache::forget(self::CACHE_KEY);
    }
}
