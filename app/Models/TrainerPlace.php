<?php

namespace App\Models;

use App\Enums\PlaceType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Where a trainer works: one row per studio, one for home, park and online.
 *
 * @property int $id
 * @property int $trainer_profile_id
 * @property PlaceType $type
 * @property string|null $name
 * @property string|null $address
 * @property int|null $city_id
 * @property float|null $lat studios only, found from the address
 * @property float|null $lng
 * @property int $sort
 * @property-read City|null $city
 */
#[Fillable(['type', 'name', 'address', 'city_id', 'lat', 'lng', 'sort'])]
class TrainerPlace extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => PlaceType::class,
            'lat' => 'float',
            'lng' => 'float',
            'sort' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<City, $this>
     */
    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class);
    }
}
