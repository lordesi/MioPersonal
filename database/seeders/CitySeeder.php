<?php

namespace Database\Seeders;

use App\Models\City;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * The provincial capitals from database/data/cities.csv: names and provinces
 * from the official ISTAT list, coordinates from Wikidata.
 * Safe to run again: existing cities are updated, none is duplicated.
 */
class CitySeeder extends Seeder
{
    public function run(): void
    {
        $file = fopen(database_path('data/cities.csv'), 'r');

        if ($file === false) {
            throw new RuntimeException('database/data/cities.csv is missing.');
        }

        $header = fgetcsv($file, escape: '');
        $now = now();
        $rows = [];

        while (($line = fgetcsv($file, escape: '')) !== false) {
            /** @var array{name: string, province_code: string, region: string, lat: string, lng: string} $city */
            $city = array_combine($header ?: [], $line);

            $rows[] = [
                'name' => $city['name'],
                'slug' => self::slug($city['name']),
                'province_code' => $city['province_code'],
                'region' => $city['region'],
                'lat' => $city['lat'],
                'lng' => $city['lng'],
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        fclose($file);

        City::upsert($rows, ['slug'], ['name', 'province_code', 'region', 'lat', 'lng', 'updated_at']);
    }

    /** "L'Aquila" → "l-aquila", "Forlì" → "forli". */
    public static function slug(string $name): string
    {
        return Str::slug(str_replace("'", ' ', $name));
    }
}
