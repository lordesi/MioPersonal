<?php

namespace App\Support;

use Illuminate\Support\Str;

/**
 * An address of the site that can be saved or logged: without query string
 * (filters, signatures, emails) and with the path segments that look like a
 * token as {token} (a password reset link has its token in the path).
 */
class PageAddress
{
    public static function clean(string $address, int $limit = 200): string
    {
        $parts = parse_url($address);

        if ($parts === false) {
            return '';
        }

        $origin = isset($parts['host']) ? ($parts['scheme'] ?? 'https').'://'.$parts['host'].(isset($parts['port']) ? ':'.$parts['port'] : '') : '';
        $path = (string) preg_replace('#/[A-Za-z0-9_\-.]{20,}(?=/|$)#', '/{token}', $parts['path'] ?? '');

        return Str::limit($origin.$path, $limit);
    }
}
