<?php

namespace App\Models;

use App\Enums\PreferredTime;
use App\Enums\TrainingGoal;
use App\Enums\TrainingMode;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\AsEnumCollection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Collection;

/**
 * The answers of "Completa il tuo profilo": one row per client, the key is the user.
 * Only training preferences, never health data.
 *
 * @property int $user_id
 * @property int|null $city_id
 * @property TrainingMode|null $mode
 * @property TrainingGoal|null $goal
 * @property Collection<int, PreferredTime>|null $times
 * @property list<int>|null $discipline_ids
 * @property int|null $budget_max_cents
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property-read City|null $city
 */
#[Fillable(['city_id', 'mode', 'goal', 'times', 'discipline_ids', 'budget_max_cents'])]
class ClientPreference extends Model
{
    protected $primaryKey = 'user_id';

    public $incrementing = false;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'mode' => TrainingMode::class,
            'goal' => TrainingGoal::class,
            'times' => AsEnumCollection::of(PreferredTime::class),
            'discipline_ids' => 'array',
            'budget_max_cents' => 'integer',
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
