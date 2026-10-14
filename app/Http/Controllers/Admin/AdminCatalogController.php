<?php

namespace App\Http\Controllers\Admin;

use App\Enums\TrainerProfileStatus;
use App\Http\Controllers\Admin\Concerns\BuildsAdminPlaceholderData;
use App\Http\Controllers\Controller;
use App\Models\City;
use App\Models\Discipline;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Discipline e città": the catalog used by search and trainer profiles.
 * Changes are saved by AdminDisciplineController and AdminCityController.
 */
class AdminCatalogController extends Controller
{
    use BuildsAdminPlaceholderData;

    public function __invoke(): Response
    {
        $cities = City::query()->orderBy('region')->orderBy('name')->get();

        return Inertia::render('admin/catalog', [
            'adminArea' => $this->adminArea(),
            // Hidden ones too: the team must be able to show them again.
            'disciplines' => Discipline::query()
                // "N trainer": the approved profiles that use it.
                ->withCount(['trainerProfiles' => fn ($query) => $query->where('status', TrainerProfileStatus::Approved)])
                ->orderBy('sort')->orderBy('id')->get()
                ->map(fn (Discipline $discipline) => [
                    'id' => $discipline->id,
                    'name' => $discipline->name,
                    'slug' => $discipline->slug,
                    'isActive' => $discipline->is_active,
                    'trainerCount' => $discipline->trainer_profiles_count,
                ])->values(),
            // Region => its cities, regions and cities in alphabetical order.
            'citiesByRegion' => $cities->groupBy('region')->map(fn ($regionCities) => $regionCities->map(fn (City $city) => [
                'id' => $city->id,
                'name' => $city->name,
                'slug' => $city->slug,
                'provinceCode' => $city->province_code,
                'region' => $city->region,
                // "45.4642, 9.19": the same text the form asks for.
                'coordinates' => $city->lat.', '.$city->lng,
                'isActive' => $city->is_active,
            ])->values()),
            'regions' => $cities->pluck('region')->unique()->sort()->values(),
        ]);
    }
}
