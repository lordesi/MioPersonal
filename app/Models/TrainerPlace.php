<?php

namespace App\Models;

use App\Enums\PlaceType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Where a trainer works: one row per studio and per gym, one for home, park
 * and online. A gym row only points to the gym (name and address are read
 * from it): App\Actions\Gym\GymLinks makes and deletes it.
 *
 * @property int $id
 * @property int $trainer_profile_id
 * @property PlaceType $type
 * @property string|null $name
 * @property string|null $address
 * @property int|null $city_id
 * @property int|null $gym_profile_id
 * @property int $sort
 * @property-read City|null $city
 * @property-read GymProfile|null $gymProfile
 */
#[Fillable(['type', 'name', 'address', 'city_id', 'gym_profile_id', 'sort'])]
class TrainerPlace extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => PlaceType::class,
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

    /**
     * @return BelongsTo<GymProfile, $this>
     */
    public function gymProfile(): BelongsTo
    {
        return $this->belongsTo(GymProfile::class);
    }

    /** "FitLab · Milano" for a gym, "Studio Pilates · Milano" for a studio. */
    public function label(): string
    {
        if ($this->type === PlaceType::Gym && $this->gymProfile !== null) {
            return implode(' · ', array_filter([$this->gymProfile->name, $this->gymProfile->city->name]));
        }

        if ($this->type === PlaceType::Studio) {
            return implode(' · ', array_filter([$this->name ?? 'Studio', $this->city?->name]));
        }

        return $this->type->label();
    }
}
