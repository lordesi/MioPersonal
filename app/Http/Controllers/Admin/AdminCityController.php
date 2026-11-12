<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CityRequest;
use App\Models\AdminActivity;
use App\Models\City;
use Database\Seeders\CitySeeder;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

/**
 * Cities in Admin · Discipline e città: add a missing one, edit or hide it.
 * A hidden city disappears from the menus and its search page gives 404.
 * Every change goes in the "Registro attività".
 */
class AdminCityController extends Controller
{
    public function store(CityRequest $request): RedirectResponse
    {
        $name = trim($request->string('name')->value());

        $city = City::create([
            'name' => $name,
            // Fixed from now on: it is in the search URL (/personal-trainer/{slug}).
            'slug' => CitySeeder::slug($name),
            ...$this->fields($request),
        ]);

        AdminActivity::log('city.created', $city, "Città «{$name}» aggiunta");
        Inertia::flash('toast', ['type' => 'success', 'message' => "«{$name}» aggiunta."]);

        return back();
    }

    /** The slug stays the same when the name changes, so shared links keep working. */
    public function update(CityRequest $request, City $city): RedirectResponse
    {
        $city->update([
            'name' => trim($request->string('name')->value()),
            'is_active' => $request->boolean('is_active', $city->is_active),
            ...$this->fields($request),
        ]);

        AdminActivity::log('city.updated', $city, "Città «{$city->name}» modificata".($city->is_active ? '' : ' (nascosta)'));
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Modifiche salvate.']);

        return back();
    }

    /**
     * @return array{province_code: string, region: string, lat: float, lng: float}
     */
    private function fields(CityRequest $request): array
    {
        return [
            'province_code' => $request->string('province_code')->value(),
            'region' => $request->string('region')->value(),
            'lat' => $request->float('lat'),
            'lng' => $request->float('lng'),
        ];
    }
}
