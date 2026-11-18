<?php

namespace App\Support;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Throwable;

/**
 * The site's traffic from Cloudflare Web Analytics (the beacon in
 * app.blade.php): visits and page views of real browsers, no cookies, the
 * bots left out by Cloudflare. Read with the GraphQL API for "Admin ·
 * Statistiche".
 *
 * Cloudflare has no "unique visitors": a visit is someone who enters the
 * site from outside (another site, a link, the address typed). It keeps the
 * data for 6 months.
 *
 * One request with all the numbers, kept for 10 minutes. Without the keys
 * (locally, in the tests) or if Cloudflare doesn't answer: null, and the page
 * shows "—".
 */
final class CloudflareAnalytics
{
    private const ENDPOINT = 'https://api.cloudflare.com/client/v4/graphql';

    private const CACHE_MINUTES = 10;

    /** After an error, try again after a minute, not at every page. */
    private const FAILED_SECONDS = 60;

    /** Cloudflare's history. */
    public const MONTHS = 6;

    private const TOP_SOURCES = 50;

    /**
     * @param  CarbonImmutable  $from  first Rome day of the 30 days
     * @param  CarbonImmutable  $previousFrom  first Rome day of the 30 days before
     * @param  CarbonImmutable  $now  Rome time
     * @return array{
     *     current: array{visits: int, pageViews: int},
     *     previous: array{visits: int, pageViews: int},
     *     daily: array<string, array{visits: int, pageViews: int}>,
     *     monthly: array<string, int>,
     *     sources: array<string, int>,
     * }|null days as Y-m-d and months as Y-m (Rome); sources as channels (Stats::channel())
     */
    public static function traffic(CarbonImmutable $from, CarbonImmutable $previousFrom, CarbonImmutable $now): ?array
    {
        if (! self::configured()) {
            return null;
        }

        $key = 'cloudflare-analytics:'.$from->toDateString().':'.$now->format('Y-m-d-H').':'.intdiv((int) $now->format('i'), self::CACHE_MINUTES);
        $cached = Cache::get($key);

        if (is_array($cached)) {
            /** @var array{current: array{visits: int, pageViews: int}, previous: array{visits: int, pageViews: int}, daily: array<string, array{visits: int, pageViews: int}>, monthly: array<string, int>, sources: array<string, int>} $cached */
            return $cached;
        }

        if ($cached === false) {
            return null;
        }

        try {
            $traffic = self::fetch($from, $previousFrom, $now);
            Cache::put($key, $traffic, now()->addMinutes(self::CACHE_MINUTES));

            return $traffic;
        } catch (Throwable $exception) {
            report($exception);
            Cache::put($key, false, now()->addSeconds(self::FAILED_SECONDS));

            return null;
        }
    }

    public static function configured(): bool
    {
        return filled(config('services.cloudflare.api_token'))
            && filled(config('services.cloudflare.account_id'))
            && filled(config('services.cloudflare.site_tag'));
    }

    /**
     * @return array{current: array{visits: int, pageViews: int}, previous: array{visits: int, pageViews: int}, daily: array<string, array{visits: int, pageViews: int}>, monthly: array<string, int>, sources: array<string, int>}
     */
    private static function fetch(CarbonImmutable $from, CarbonImmutable $previousFrom, CarbonImmutable $now): array
    {
        // Each field asks for 31 days at most: Cloudflare's limit for one query.
        $fields = [
            'current' => self::field($from, $now, 'limit: 1'),
            'previous' => self::field($previousFrom, $from, 'limit: 1'),
            'daily' => self::field($from, $now, 'limit: 1000', 'dimensions { datetimeHour }'),
            'sources' => self::field($from, $now, 'limit: '.self::TOP_SOURCES.', orderBy: [sum_visits_DESC]', 'dimensions { refererHost }'),
        ];

        $months = [];

        for ($month = $now->startOfMonth()->subMonths(self::MONTHS - 1); $month <= $now; $month = $month->addMonth()) {
            $alias = 'm'.$month->format('Ym');
            $months[$alias] = $month->format('Y-m');
            $fields[$alias] = self::field($month, min($month->addMonth(), $now), 'limit: 1');
        }

        $body = collect($fields)->map(fn (string $field, string $alias) => "{$alias}: {$field}")->implode("\n");
        $account = json_encode((string) config('services.cloudflare.account_id'));
        $query = "{ viewer { accounts(filter: {accountTag: {$account}}) {\n{$body}\n} } }";

        $response = Http::withToken((string) config('services.cloudflare.api_token'))
            ->acceptJson()
            ->timeout(5)
            ->post(self::ENDPOINT, ['query' => $query])
            ->throw();

        $errors = $response->json('errors');

        if (! empty($errors)) {
            throw new RuntimeException('Cloudflare Web Analytics: '.json_encode($errors));
        }

        $data = $response->json('data.viewer.accounts.0');

        if (! is_array($data)) {
            throw new RuntimeException('Cloudflare Web Analytics: no account in the answer.');
        }

        $totals = fn (array $rows) => ['visits' => (int) ($rows[0]['sum']['visits'] ?? 0), 'pageViews' => (int) ($rows[0]['count'] ?? 0)];

        $daily = [];

        foreach ($data['daily'] ?? [] as $row) {
            $day = CarbonImmutable::parse($row['dimensions']['datetimeHour'])->setTimezone(TrainerSlots::TIMEZONE)->toDateString();
            $daily[$day]['visits'] = ($daily[$day]['visits'] ?? 0) + (int) ($row['sum']['visits'] ?? 0);
            $daily[$day]['pageViews'] = ($daily[$day]['pageViews'] ?? 0) + (int) ($row['count'] ?? 0);
        }

        $sources = [];

        foreach ($data['sources'] ?? [] as $row) {
            $visits = (int) ($row['sum']['visits'] ?? 0);

            // The pages opened from inside the site are not visits.
            if ($visits > 0) {
                $channel = Stats::channel((string) ($row['dimensions']['refererHost'] ?? ''));
                $sources[$channel] = ($sources[$channel] ?? 0) + $visits;
            }
        }

        return [
            'current' => $totals($data['current'] ?? []),
            'previous' => $totals($data['previous'] ?? []),
            'daily' => $daily,
            'monthly' => collect($months)->mapWithKeys(fn (string $month, string $alias) => [$month => $totals($data[$alias] ?? [])['visits']])->all(),
            'sources' => $sources,
        ];
    }

    /** One field of the query: the page loads of our site between the two times. */
    private static function field(CarbonImmutable $from, CarbonImmutable $to, string $options, string $dimensions = ''): string
    {
        $filter = sprintf(
            '{AND: [{siteTag: %s}, {datetime_geq: %s}, {datetime_lt: %s}]}',
            json_encode((string) config('services.cloudflare.site_tag')),
            json_encode($from->utc()->format('Y-m-d\TH:i:s\Z')),
            json_encode($to->utc()->format('Y-m-d\TH:i:s\Z')),
        );

        return "rumPageloadEventsAdaptiveGroups(filter: {$filter}, {$options}) { count sum { visits } {$dimensions} }";
    }
}
