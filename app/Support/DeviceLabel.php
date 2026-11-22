<?php

namespace App\Support;

/**
 * The device and the browser of a User-Agent in words, e.g. "iPhone · Safari",
 * for "Segnala un problema". Only what the team needs to try again: no version
 * numbers, and the raw string is not saved.
 */
class DeviceLabel
{
    public static function from(?string $userAgent): string
    {
        $agent = (string) $userAgent;

        if ($agent === '') {
            return 'Sconosciuto';
        }

        return self::device($agent).' · '.self::browser($agent);
    }

    private static function device(string $agent): string
    {
        return match (true) {
            str_contains($agent, 'iPhone') => 'iPhone',
            // iPadOS asks for the desktop pages: it says "Macintosh", but has a touch screen.
            str_contains($agent, 'iPad') => 'iPad',
            str_contains($agent, 'Android') => str_contains($agent, 'Mobile') ? 'Android' : 'Tablet Android',
            str_contains($agent, 'Windows') => 'Windows',
            str_contains($agent, 'Macintosh') => 'Mac',
            str_contains($agent, 'CrOS') => 'Chromebook',
            str_contains($agent, 'Linux') => 'Linux',
            default => 'Altro dispositivo',
        };
    }

    private static function browser(string $agent): string
    {
        return match (true) {
            str_contains($agent, 'Edg') => 'Edge',
            str_contains($agent, 'SamsungBrowser') => 'Samsung Internet',
            str_contains($agent, 'OPR'), str_contains($agent, 'Opera') => 'Opera',
            str_contains($agent, 'Firefox'), str_contains($agent, 'FxiOS') => 'Firefox',
            str_contains($agent, 'CriOS'), str_contains($agent, 'Chrome') => 'Chrome',
            str_contains($agent, 'Safari') => 'Safari',
            default => 'altro browser',
        };
    }
}
