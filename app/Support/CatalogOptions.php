<?php

namespace App\Support;

use App\Models\City;
use App\Models\Discipline;
use App\Models\GymProfile;

/**
 * The lists of the catalog, in the format of the select menus and chips:
 * { value: slug, label: name }. Every page reads them from here, so they are
 * the same everywhere.
 */
final class CatalogOptions
{
    /**
     * Active disciplines, in the team's order.
     *
     * @return list<array{value: string, label: string}>
     */
    public static function disciplines(): array
    {
        return array_values(Discipline::query()
            ->active()
            ->orderBy('sort')
            ->get(['slug', 'name'])
            ->map(fn (Discipline $discipline) => ['value' => $discipline->slug, 'label' => $discipline->name])
            ->all());
    }

    /**
     * Active cities in alphabetical order, with their region for grouping.
     *
     * @return list<array{value: string, label: string, region: string}>
     */
    public static function cities(): array
    {
        return array_values(City::query()
            ->active()
            ->orderBy('name')
            ->get(['slug', 'name', 'region'])
            ->map(fn (City $city) => ['value' => $city->slug, 'label' => $city->name, 'region' => $city->region])
            ->all());
    }

    /**
     * The approved gyms, for "In palestra" of the trainer's profile: by city, then name.
     *
     * @return list<array{id: int, name: string, city: string}>
     */
    public static function gyms(): array
    {
        return array_values(GymProfile::query()
            ->approved()
            ->join('cities', 'cities.id', '=', 'gym_profiles.city_id')
            ->orderBy('cities.name')
            ->orderBy('gym_profiles.name')
            ->get(['gym_profiles.id', 'gym_profiles.name', 'cities.name as city_name'])
            ->map(fn (GymProfile $gym) => [
                'id' => $gym->id,
                'name' => $gym->name,
                'city' => (string) $gym->getAttribute('city_name'),
            ])
            ->all());
    }

    /**
     * Like cities(), plus the center of each city: the page finds the closest
     * one to the user's position in the browser, so the position stays there.
     *
     * @return list<array{value: string, label: string, region: string, lat: float, lng: float}>
     */
    public static function citiesWithCoordinates(): array
    {
        return array_values(City::query()
            ->active()
            ->orderBy('name')
            ->get(['slug', 'name', 'region', 'lat', 'lng'])
            ->map(fn (City $city) => [
                'value' => $city->slug,
                'label' => $city->name,
                'region' => $city->region,
                'lat' => $city->lat,
                'lng' => $city->lng,
            ])
            ->all());
    }
}
