<?php

namespace App\Support;

use App\Models\City;
use App\Models\Discipline;

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
