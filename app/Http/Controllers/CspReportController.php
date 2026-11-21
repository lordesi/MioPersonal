<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * The violations of the Content-Security-Policy (App\Support\ContentSecurityPolicy),
 * sent by the browsers. Each different violation goes to storage/logs/csp.log once
 * a day: no IP, no user, and the addresses without query string and tokens
 * (a password reset link has its token in the path).
 *
 * Outside the web group (bootstrap/app.php): no session, no CSRF, no visit counted.
 */
class CspReportController extends Controller
{
    private const MAX_BYTES = 16_384;

    public function __invoke(Request $request): Response
    {
        $body = $request->getContent();

        if (strlen($body) > self::MAX_BYTES) {
            return response()->noContent(413);
        }

        $report = json_decode($body, true)['csp-report'] ?? null;

        if (! is_array($report)) {
            return response()->noContent();
        }

        $violation = [
            'directive' => self::text($report['effective-directive'] ?? $report['violated-directive'] ?? ''),
            'blocked' => self::address($report['blocked-uri'] ?? ''),
            'page' => self::address($report['document-uri'] ?? ''),
            'source' => self::address($report['source-file'] ?? ''),
            'line' => is_int($report['line-number'] ?? null) ? $report['line-number'] : null,
            'sample' => self::text($report['script-sample'] ?? ''),
            'disposition' => self::text($report['disposition'] ?? ''),
        ];

        $key = 'csp-report:'.sha1(implode('|', [
            $violation['directive'], $violation['blocked'], $violation['page'], $violation['source'], $violation['line'],
        ]));

        if (Cache::add($key, true, now()->addDay())) {
            Log::channel('csp')->warning('CSP violation', $violation);
        }

        return response()->noContent();
    }

    private static function text(mixed $value): string
    {
        return is_string($value) ? Str::limit($value, 120) : '';
    }

    /**
     * "inline", "eval", "data" stay as they are; an address loses its query string,
     * and path segments that look like a token become {token}.
     */
    private static function address(mixed $value): string
    {
        if (! is_string($value) || ! str_contains($value, '/')) {
            return self::text($value);
        }

        $parts = parse_url($value);

        if ($parts === false) {
            return '';
        }

        $origin = isset($parts['host']) ? ($parts['scheme'] ?? 'https').'://'.$parts['host'].(isset($parts['port']) ? ':'.$parts['port'] : '') : '';
        $path = (string) preg_replace('#/[A-Za-z0-9_\-.]{20,}(?=/|$)#', '/{token}', $parts['path'] ?? '');

        return Str::limit($origin.$path, 200);
    }
}
