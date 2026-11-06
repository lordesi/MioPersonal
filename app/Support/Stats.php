<?php

namespace App\Support;

use App\Models\City;
use App\Models\TrainerProfile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

/**
 * Collects the history the team's numbers need (see the stats migrations):
 * visits and page views, the days each user was active, the searches, the
 * profile views and where new users came from.
 *
 * Only real visits count: no search engines or link previews, no Inertia
 * prefetch (hovering a link) and no partial reloads of the same page.
 */
final class Stats
{
    /** Search engines, link previews, monitoring and headless browsers. */
    private const BOT_PATTERN = '/bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|headless|lighthouse|pingdom|uptime|curl|wget|python|httpclient/i';

    public static function countable(Request $request): bool
    {
        $agent = (string) $request->userAgent();

        return $agent !== ''
            && ! preg_match(self::BOT_PATTERN, $agent)
            && $request->header('Purpose') !== 'prefetch'
            && ! $request->hasHeader('X-Inertia-Partial-Data');
    }

    /** Session key of the channel the visit came from (see acquisition()). */
    public const ACQUISITION_KEY = 'stats.acquisition';

    /** Known referrers grouped under one channel name. */
    private const CHANNELS = [
        'google' => 'google', 'bing' => 'bing', 'duckduckgo' => 'duckduckgo', 'yahoo' => 'yahoo', 'ecosia' => 'ecosia',
        'instagram' => 'instagram', 'facebook' => 'facebook', 'fb' => 'facebook', 'tiktok' => 'tiktok',
        'linkedin' => 'linkedin', 'lnkd' => 'linkedin', 'youtube' => 'youtube', 'whatsapp' => 'whatsapp',
        't.co' => 'x', 'twitter' => 'x', 'x.com' => 'x', 'reddit' => 'reddit', 'chatgpt' => 'chatgpt', 'openai' => 'chatgpt',
    ];

    /**
     * Called by TrackVisit after each page: the page view of the area, the
     * unique visitor of the day and, on the first page of a session, the visit
     * with its channel. No cookie of its own: the session cookie already exists.
     */
    public static function recordPageView(Request $request): void
    {
        if (! self::countable($request) || $request->user()?->isAdmin()) {
            return;
        }

        self::safely(function () use ($request) {
            $day = self::today();

            DB::table('page_view_days')->upsert(
                [['day' => $day, 'section' => self::section($request), 'views' => 1]],
                ['day', 'section'],
                ['views' => DB::raw('page_view_days.views + 1')],
            );

            DB::table('visitor_days')->insertOrIgnore(['day' => $day, 'visitor' => self::visitor($request, $day)]);

            if ($request->hasSession() && ! $request->session()->has(self::ACQUISITION_KEY)) {
                $acquisition = self::acquisition($request);
                $request->session()->put(self::ACQUISITION_KEY, $acquisition);

                DB::table('visit_days')->upsert(
                    [['day' => $day, 'source' => $acquisition['source'], 'visits' => 1]],
                    ['day', 'source'],
                    ['visits' => DB::raw('visit_days.visits + 1')],
                );
            }
        });
    }

    /**
     * A number missing from the statistics is better than a page that
     * doesn't open: errors go to the log, the visitor sees nothing.
     */
    public static function safely(callable $record): void
    {
        try {
            $record();
        } catch (Throwable $exception) {
            report($exception);
        }
    }

    /**
     * The channel of the first page of the visit: the utm_* of a campaign
     * link, otherwise the site that linked here, otherwise "direct".
     *
     * @return array{source: string, medium: string|null, campaign: string|null, landing: string}
     */
    public static function acquisition(Request $request): array
    {
        $clean = fn (?string $value) => $value === null || trim($value) === '' ? null : mb_substr(mb_strtolower(trim($value)), 0, 60);

        $source = $clean($request->query('utm_source'));

        if ($source === null) {
            $host = mb_strtolower((string) parse_url((string) $request->headers->get('referer'), PHP_URL_HOST));
            $host = preg_replace('/^(www\.|m\.|l\.|lm\.)/', '', $host) ?? '';

            if ($host !== '' && $host !== $request->getHost()) {
                // Whole parts of the domain: "google" matches google.it, "x.com" doesn't match box.com.
                $source = collect(self::CHANNELS)->first(
                    fn (string $channel, string $name) => preg_match('/(^|\.)'.preg_quote($name, '/').'(\.|$)/', $host) === 1,
                ) ?? mb_substr($host, 0, 60);
            }
        }

        return [
            'source' => $source ?? 'direct',
            'medium' => $clean($request->query('utm_medium')),
            'campaign' => $clean($request->query('utm_campaign')),
            'landing' => mb_substr('/'.ltrim($request->path(), '/'), 0, 200),
        ];
    }

    /** One row per user and Rome day; called by TrackLastActivity. */
    public static function recordActivity(User $user): void
    {
        self::safely(fn () => DB::table('user_activity_days')->insertOrIgnore([
            'user_id' => $user->id,
            'day' => self::today(),
            'role' => $user->role->value,
        ]));
    }

    /**
     * A search as the visitor made it: only the first page of the results.
     *
     * @param  list<string>  $disciplines
     * @param  list<string>  $goals
     * @param  list<string>  $filters  names of the other filters in use
     */
    public static function recordSearch(Request $request, ?City $city, array $disciplines, array $goals, array $filters, int $results): void
    {
        if (! self::countable($request)) {
            return;
        }

        self::safely(fn () => DB::table('search_logs')->insert([
            'city_id' => $city?->id,
            'disciplines' => json_encode($disciplines),
            'goals' => json_encode($goals),
            'filters' => json_encode($filters),
            'results' => $results,
            'role' => self::role($request->user()),
            'created_at' => now(),
        ]));
    }

    /** Not the trainer looking at the own profile, nor the team. */
    public static function recordProfileView(Request $request, TrainerProfile $profile): void
    {
        $user = $request->user();

        if (! self::countable($request) || $user?->id === $profile->user_id || $user?->isAdmin()) {
            return;
        }

        self::safely(fn () => DB::table('trainer_profile_views')->upsert(
            [['trainer_profile_id' => $profile->id, 'day' => self::today(), 'views' => 1]],
            ['trainer_profile_id', 'day'],
            ['views' => DB::raw('trainer_profile_views.views + 1')],
        ));
    }

    /** The area of the site, for the page views. */
    private static function section(Request $request): string
    {
        return match (true) {
            $request->is('area-trainer*') => 'trainer',
            $request->is('area-cliente*', 'prenotazioni*', 'preferiti*', 'profilo', 'impostazioni*', 'completa-profilo*') => 'client',
            default => 'public',
        };
    }

    /**
     * The same browser on the same day gives the same code; the next day the
     * salt changes and the old one is forgotten, so nobody can be followed
     * across days or traced back from the code. The IP is never saved.
     */
    private static function visitor(Request $request, string $day): string
    {
        $salt = Cache::remember("stats.visitor-salt.{$day}", now()->addDays(2), fn () => Str::random(40));

        return hash('sha256', $salt.'|'.$request->ip().'|'.$request->userAgent());
    }

    private static function today(): string
    {
        return now(TrainerSlots::TIMEZONE)->toDateString();
    }

    private static function role(?User $user): string
    {
        return $user?->role->value ?? 'guest';
    }
}
