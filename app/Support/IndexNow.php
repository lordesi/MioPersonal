<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Throwable;

use function Illuminate\Support\defer;

/**
 * IndexNow: tells Bing (the index behind ChatGPT search and Copilot), Yandex
 * and the other members that a public page was published, changed or
 * removed, so they read it again in minutes instead of weeks.
 *
 * Only on the real site with INDEXNOW_KEY set: the key is served at
 * /{key}.txt (IndexNowKeyController). The ping leaves after the response
 * and a page is sent at most once every 10 minutes; a failure is reported,
 * never shown.
 */
final class IndexNow
{
    private const ENDPOINT = 'https://api.indexnow.org/indexnow';

    /** A page saved again and again (an editor typing) is sent once. */
    private const DEBOUNCE_MINUTES = 10;

    public static function key(): ?string
    {
        $key = config('services.indexnow.key');

        return is_string($key) && $key !== '' ? $key : null;
    }

    public static function enabled(): bool
    {
        return self::key() !== null && app()->isProduction() && ! Staging::active();
    }

    public static function submit(string ...$urls): void
    {
        if (! self::enabled()) {
            return;
        }

        $urls = array_values(array_filter(
            array_unique($urls),
            fn (string $url) => Cache::add('indexnow:'.sha1($url), true, now()->addMinutes(self::DEBOUNCE_MINUTES)),
        ));

        if ($urls === []) {
            return;
        }

        $key = (string) self::key();

        defer(function () use ($urls, $key) {
            try {
                Http::timeout(5)->asJson()->post(self::ENDPOINT, [
                    'host' => parse_url((string) config('app.url'), PHP_URL_HOST),
                    'key' => $key,
                    'keyLocation' => route('indexnow.key', $key),
                    'urlList' => $urls,
                ])->throw();
            } catch (Throwable $exception) {
                report($exception);
            }
        });
    }
}
