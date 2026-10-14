<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A service of a trainer ("Seduta singola", "Pacchetto 10 sedute").
 * Prices are indicative, in whole cents: payment happens outside MioPersonal.
 *
 * @property int $id
 * @property int $trainer_profile_id
 * @property string $name
 * @property string $kind session or package
 * @property int $minutes
 * @property int $price_cents
 * @property bool $price_per_hour
 * @property bool $fixed_duration
 * @property string|null $note
 * @property bool $online_only
 * @property int|null $package_sessions
 * @property int $sort
 * @property bool $is_active
 */
#[Fillable([
    'name', 'kind', 'minutes', 'price_cents', 'price_per_hour', 'fixed_duration', 'note',
    'online_only', 'package_sessions', 'sort', 'is_active',
])]
class Service extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'minutes' => 'integer',
            'price_cents' => 'integer',
            'price_per_hour' => 'boolean',
            'fixed_duration' => 'boolean',
            'online_only' => 'boolean',
            'package_sessions' => 'integer',
            'sort' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<TrainerProfile, $this>
     */
    public function trainerProfile(): BelongsTo
    {
        return $this->belongsTo(TrainerProfile::class);
    }
}
