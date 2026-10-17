<?php

namespace App\Support;

use App\Models\City;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Sleep;

/**
 * From an address to its coordinates, with Nominatim: the free service of
 * OpenStreetMap. Its rules (operations.osmfoundation.org/policies/nominatim):
 * at most 1 request per second, a User-Agent that names the app, results
 * saved and not asked again.
 */
class Geocoder
{
    private const URL = 'https://nominatim.openstreetmap.org/search';

    /** Half side of the search box around the city center, in degrees (about 10 km). */
    private const BOX = 0.1;

    /**
     * @return array{lat: float, lng: float}|null null when the address is not
     *                                            in the city or Nominatim doesn't answer
     */
    public static function find(string $address, City $city): ?array
    {
        try {
            // Names the app and its site (a placeholder email like hello@example.com is refused).
            $response = Http::withUserAgent(config('app.name').'/1.0 ('.config('app.url').')')
                ->timeout(5)
                ->get(self::URL, [
                    'q' => "{$address}, {$city->name}",
                    'countrycodes' => 'it',
                    // Only around the city: "Milano" is also the province, with its own "Via Roma".
                    'viewbox' => implode(',', [$city->lng - self::BOX, $city->lat + self::BOX, $city->lng + self::BOX, $city->lat - self::BOX]),
                    'bounded' => 1,
                    'addressdetails' => 1,
                    'format' => 'jsonv2',
                    'limit' => 1,
                ]);
        } catch (ConnectionException) {
            return null;
        } finally {
            // At most 1 request per second, even when many studios are saved together.
            Sleep::for(1)->second();
        }

        $result = $response->successful() ? $response->json('0') : null;

        if (! is_array($result) || ! isset($result['lat'], $result['lon']) || ! self::inCity($result, $city)) {
            return null;
        }

        return ['lat' => (float) $result['lat'], 'lng' => (float) $result['lon']];
    }

    /**
     * The box also holds the towns next to the city (Cormano next to Milano):
     * the result counts only when its town is the city itself.
     *
     * @param  array<string, mixed>  $result
     */
    private static function inCity(array $result, City $city): bool
    {
        $town = $result['address']['city'] ?? $result['address']['town'] ?? $result['address']['village'] ?? null;

        if (! is_string($town)) {
            return false;
        }

        // "Bolzano - Bozen" and "Bolzano" are the same city.
        $town = mb_strtolower($town);
        $name = mb_strtolower($city->name);

        return str_contains($town, $name) || str_contains($name, $town);
    }
}
