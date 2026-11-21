<?php

namespace App\Support;

/**
 * The Content-Security-Policy of the pages: where scripts, styles, images and
 * connections may come from. Today only reported (Content-Security-Policy-Report-Only,
 * see SecurityHeaders): the browser blocks nothing and sends each violation to
 * /csp-report (CspReportController → storage/logs/csp.log).
 *
 * What is allowed, and why:
 * - scripts: our build, the inline ones with the nonce of the request (Vite in local),
 *   the Cloudflare Web Analytics beacon;
 * - styles: ours, plus inline ones (the page background in app.blade.php, React
 *   `style={…}`, Radix and sonner): an inline style can't run code;
 * - images: ours, `data:` and `blob:` (photo previews, crop, story image, QR);
 * - connections: ours, Sentry (the errors of the browser), Cloudflare (the visits);
 * - no plugins (`object-src`), no `<base>` to another site, forms only to us.
 *
 * In local, with `npm run dev`, also the Vite dev server (scripts, styles, fonts,
 * hot reload over WebSocket).
 */
final class ContentSecurityPolicy
{
    public const REPORT_PATH = '/csp-report';

    public static function header(string $nonce, ?string $viteDevServer = null): string
    {
        [$dev, $devSocket] = self::devServer($viteDevServer);

        $directives = [
            'default-src' => ["'self'"],
            'script-src' => ["'self'", "'nonce-{$nonce}'", 'https://static.cloudflareinsights.com', ...$dev],
            'style-src' => ["'self'", "'unsafe-inline'", ...$dev],
            'img-src' => ["'self'", 'data:', 'blob:', ...$dev],
            'font-src' => ["'self'", 'data:', ...$dev],
            'connect-src' => ["'self'", 'https://*.ingest.de.sentry.io', 'https://cloudflareinsights.com', ...$dev, ...$devSocket],
            'worker-src' => ["'self'"],
            'manifest-src' => ["'self'"],
            'object-src' => ["'none'"],
            'base-uri' => ["'self'"],
            'form-action' => ["'self'"],
            'report-uri' => [self::REPORT_PATH],
        ];

        return implode('; ', array_map(
            fn (string $name, array $sources) => $name.' '.implode(' ', $sources),
            array_keys($directives),
            $directives,
        ));
    }

    /**
     * The Vite dev server (local only): its origin, and the same over WebSocket for
     * the hot reload. A CSP source can't name an IPv6 address (`http://[::1]:5173`,
     * the default of Vite on Windows), so then the whole scheme is allowed.
     *
     * @return array{0: list<string>, 1: list<string>}
     */
    private static function devServer(?string $origin): array
    {
        if ($origin === null || $origin === '') {
            return [[], []];
        }

        $origin = rtrim($origin, '/');
        $secure = str_starts_with($origin, 'https://');

        if (str_contains($origin, '[')) {
            return [[$secure ? 'https:' : 'http:'], [$secure ? 'wss:' : 'ws:']];
        }

        return [[$origin], [(string) preg_replace('#^http#', 'ws', $origin)]];
    }
}
