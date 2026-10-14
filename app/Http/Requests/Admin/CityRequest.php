<?php

namespace App\Http\Requests\Admin;

use App\Models\City;
use Database\Seeders\CitySeeder;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * "Aggiungi" and "Modifica" of a city in Admin · Discipline e città.
 * The coordinates arrive as the text copied from Google Maps, e.g. "45.4642, 9.1900".
 */
class CityRequest extends FormRequest
{
    /** A box around Italy: coordinates outside it are surely a mistake. */
    private const LAT = [35.4, 47.2];

    private const LNG = [6.5, 18.6];

    protected function prepareForValidation(): void
    {
        $changes = ['province_code' => strtoupper(trim($this->string('province_code')->value()))];

        // "45.4642, 9.1900" → lat 45.4642, lng 9.19. Anything else fails the rules below.
        if (preg_match('/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/', $this->string('coordinates')->value(), $match)) {
            $changes['lat'] = (float) $match[1];
            $changes['lng'] = (float) $match[2];
        }

        $this->merge($changes);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $city = $this->route('city');

        return [
            'name' => [
                'required', 'string', 'max:100',
                Rule::unique(City::class)->ignore($city instanceof City ? $city->id : null),
            ],
            'province_code' => ['required', 'regex:/^[A-Z]{2}$/'],
            // One of the 20 regions already in the list.
            'region' => ['required', Rule::in(City::query()->distinct()->pluck('region')->all())],
            'coordinates' => ['required', 'string'],
            'lat' => ['required_with:coordinates', 'numeric', 'between:'.implode(',', self::LAT)],
            'lng' => ['required_with:coordinates', 'numeric', 'between:'.implode(',', self::LNG)],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * A new city must not have the slug of another one (it is in the search URL).
     *
     * @return list<\Closure(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                if ($this->route('city') !== null || $validator->errors()->has('name')) {
                    return;
                }

                if (City::where('slug', CitySeeder::slug($this->string('name')->value()))->exists()) {
                    $validator->errors()->add('name', 'Esiste già una città con questo nome.');
                }
            },
            // Show the coordinate problems under the only field the page has.
            function (Validator $validator) {
                if ($validator->errors()->hasAny(['lat', 'lng'])) {
                    $validator->errors()->add('coordinates', 'Incolla le coordinate da Google Maps, es. 45.4642, 9.1900: devono cadere in Italia.');
                }
            },
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.unique' => 'Esiste già una città con questo nome.',
            'province_code.required' => 'Scrivi la sigla della provincia, es. MI.',
            'province_code.regex' => 'La sigla della provincia ha 2 lettere, es. MI.',
            'region.in' => 'Scegli una delle regioni dell\'elenco.',
            'coordinates.required' => 'Incolla le coordinate da Google Maps, es. 45.4642, 9.1900.',
            'lat.required_with' => 'Incolla le coordinate da Google Maps, es. 45.4642, 9.1900.',
        ];
    }
}
