<?php

namespace App\Support;

use App\Models\City;
use App\Models\GymProfile;
use App\Models\TrainerProfile;
use App\Models\User;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use JsonException;
use Throwable;

/**
 * Collects the history the team's numbers need (see the stats migrations):
 * the days each user was active, the searches, the profile views, the app
 * opened from its icon and where new users came from. The visits to the site
 * are counted by Cloudflare Web Analytics (CloudflareAnalytics).
 *
 * Only real visits count: no search engines or link previews and no partial
 * reloads of the same page. A page prefetched by Inertia counts only once it
 * is shown (see record()).
 */
final class Stats
{
    /** Search engines, link previews, monitoring and headless browsers. */
    private const BOT_PATTERN = '/bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|headless|lighthouse|pingdom|uptime|curl|wget|python|httpclient/i';

    public static function countable(Request $request): bool
    {
        return self::isVisitor($request) && $request->header('Purpose') !== 'prefetch';
    }

    /** A person's browser (not a bot), on a whole page (not a partial reload). */
    private static function isVisitor(Request $request): bool
    {
        $agent = (string) $request->userAgent();

        return $agent !== ''
            && ! preg_match(self::BOT_PATTERN, $agent)
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
     * Called by RememberAcquisition after each page: on the first page of a
     * session, the channel it came from goes in the session, for the sign-up
     * (AppServiceProvider::recordAcquisition). The visits themselves are
     * counted by Cloudflare Web Analytics (CloudflareAnalytics).
     */
    public static function rememberAcquisition(Request $request): void
    {
        if (! self::countable($request) || ! $request->hasSession() || $request->session()->has(self::ACQUISITION_KEY)) {
            return;
        }

        $request->session()->put(self::ACQUISITION_KEY, self::acquisition($request));
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

            if ($host !== '' && $host !== $request->getHost()) {
                $source = self::channel($host);
            }
        }

        return [
            'source' => $source ?? 'direct',
            'medium' => $clean($request->query('utm_medium')),
            'campaign' => $clean($request->query('utm_campaign')),
            'landing' => mb_substr('/'.ltrim($request->path(), '/'), 0, 200),
        ];
    }

    /**
     * The channel of the site that linked here: "l.instagram.com" is
     * "instagram", an unknown site is its domain, no site is "direct".
     */
    public static function channel(string $host): string
    {
        $host = preg_replace('/^(www\.|m\.|l\.|lm\.)/', '', mb_strtolower(trim($host))) ?? '';

        if ($host === '') {
            return 'direct';
        }

        // Whole parts of the domain: "google" matches google.it, "x.com" doesn't match box.com.
        return collect(self::CHANNELS)->first(
            fn (string $channel, string $name) => preg_match('/(^|\.)'.preg_quote($name, '/').'(\.|$)/', $host) === 1,
        ) ?? mb_substr($host, 0, 60);
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
     * @param  'trainer'|'gym'|'course'  $kind  the trainers', the gyms' or the courses' search
     */
    public static function recordSearch(Request $request, ?City $city, array $disciplines, array $goals, array $filters, int $results, string $kind = 'trainer'): void
    {
        if (! self::isVisitor($request)) {
            return;
        }

        self::record($request, 'search', [
            'city_id' => $city?->id,
            'disciplines' => $disciplines,
            'goals' => $goals,
            'filters' => $filters,
            'results' => $results,
            'role' => self::role($request->user()),
            'kind' => $kind,
        ]);
    }

    /** Not the gym looking at its own profile, nor the team. */
    public static function recordGymView(Request $request, GymProfile $profile): void
    {
        $user = $request->user();

        if (! self::isVisitor($request) || $user?->id === $profile->user_id || $user?->isAdmin()) {
            return;
        }

        self::record($request, 'gym-view', ['id' => $profile->id]);
    }

    /** Not the trainer looking at the own profile, nor the team. */
    public static function recordProfileView(Request $request, TrainerProfile $profile): void
    {
        $user = $request->user();

        if (! self::isVisitor($request) || $user?->id === $profile->user_id || $user?->isAdmin()) {
            return;
        }

        self::record($request, 'profile-view', ['id' => $profile->id]);
    }

    /** Request attribute with the views and searches of a prefetched page. */
    private const PENDING_KEY = 'stats.pending';

    /** A prefetched page shown later than this is not counted any more. */
    private const PENDING_TTL_SECONDS = 900;

    /**
     * A view or a search of a page. A prefetch (the pointer on a link, the
     * tab bar of the areas) may never be shown: it is kept in the page as a
     * sealed token instead, which the browser sends back only if it shows the
     * page from its cache (resources/js/lib/prefetch.ts, recordPending()).
     *
     * @param  'search'|'gym-view'|'profile-view'  $type
     * @param  array<string, mixed>  $data
     */
    private static function record(Request $request, string $type, array $data): void
    {
        if ($request->header('Purpose') === 'prefetch') {
            $request->attributes->set(self::PENDING_KEY, [...$request->attributes->get(self::PENDING_KEY, []), [$type, $data]]);

            return;
        }

        self::write($type, $data);
    }

    /**
     * The token of the views and searches of this prefetched page, for the
     * `pendingVisit` prop (HandleInertiaRequests); null when there are none.
     */
    public static function pendingToken(Request $request): ?string
    {
        $pending = $request->attributes->get(self::PENDING_KEY, []);

        if ($pending === []) {
            return null;
        }

        return Crypt::encryptString((string) json_encode([
            'records' => $pending,
            'user' => $request->user()?->getAuthIdentifier(),
            'at' => now()->getTimestamp(),
            'nonce' => Str::random(20),
        ]));
    }

    /**
     * The prefetched page was shown: its views and searches are saved, once,
     * for the same visitor and only shortly after the prefetch.
     */
    public static function recordPending(Request $request, string $token): bool
    {
        if (! self::isVisitor($request)) {
            return false;
        }

        try {
            $payload = json_decode(Crypt::decryptString($token), true, flags: JSON_THROW_ON_ERROR);
        } catch (DecryptException|JsonException) {
            return false;
        }

        if (! is_array($payload)
            || ($payload['user'] ?? null) !== $request->user()?->getAuthIdentifier()
            || ! is_int($payload['at'] ?? null)
            || $payload['at'] < now()->getTimestamp() - self::PENDING_TTL_SECONDS
            || ! is_string($payload['nonce'] ?? null)
            || ! Cache::add('stats:pending:'.$payload['nonce'], true, self::PENDING_TTL_SECONDS)) {
            return false;
        }

        foreach ((array) ($payload['records'] ?? []) as $record) {
            if (is_array($record) && is_string($record[0] ?? null) && is_array($record[1] ?? null)) {
                self::write($record[0], $record[1]);
            }
        }

        return true;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private static function write(string $type, array $data): void
    {
        self::safely(fn () => match ($type) {
            'search' => DB::table('search_logs')->insert([
                'city_id' => $data['city_id'] ?? null,
                'disciplines' => json_encode($data['disciplines'] ?? []),
                'goals' => json_encode($data['goals'] ?? []),
                'filters' => json_encode($data['filters'] ?? []),
                'results' => (int) ($data['results'] ?? 0),
                'role' => (string) ($data['role'] ?? 'guest'),
                'kind' => (string) ($data['kind'] ?? 'trainer'),
                'created_at' => now(),
            ]),
            'gym-view' => DB::table('gym_profile_views')->upsert(
                [['gym_profile_id' => (int) ($data['id'] ?? 0), 'day' => self::today(), 'views' => 1]],
                ['gym_profile_id', 'day'],
                ['views' => DB::raw('gym_profile_views.views + 1')],
            ),
            'profile-view' => DB::table('trainer_profile_views')->upsert(
                [['trainer_profile_id' => (int) ($data['id'] ?? 0), 'day' => self::today(), 'views' => 1]],
                ['trainer_profile_id', 'day'],
                ['views' => DB::raw('trainer_profile_views.views + 1')],
            ),
            default => null,
        });
    }

    /** Section of `page_view_days` that counts the app opened from the home screen icon. */
    public const APP_OPEN_SECTION = 'app-open';

    /** The app opened from its icon (AppStartController); not the team. */
    public static function recordAppOpen(Request $request): void
    {
        if (! self::countable($request) || $request->user()?->isAdmin()) {
            return;
        }

        self::safely(fn () => DB::table('page_view_days')->upsert(
            [['day' => self::today(), 'section' => self::APP_OPEN_SECTION, 'views' => 1]],
            ['day', 'section'],
            ['views' => DB::raw('page_view_days.views + 1')],
        ));
    }

    /** Every table of the history, emptied by `stats:reset`. */
    public const HISTORY_TABLES = [
        'page_view_days', 'search_logs', 'trainer_profile_views', 'gym_profile_views', 'user_activity_days',
    ];

    private static function today(): string
    {
        return now(TrainerSlots::TIMEZONE)->toDateString();
    }

    private static function role(?User $user): string
    {
        return $user?->role->value ?? 'guest';
    }
}
