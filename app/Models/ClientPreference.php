<?php

namespace App\Models;

use App\Enums\ActivityLevel;
use App\Enums\FitnessLevel;
use App\Enums\PreferredTime;
use App\Enums\Sex;
use App\Enums\TrainingExperience;
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
 * The training preferences (search order) and "Su di te", what the trainers the
 * client booked read (see App\Support\ClientAbout).
 *
 * Height and weight only with `body_data_consent_at` (GDPR art. 9): see
 * CompleteProfileController::update. No other health data.
 *
 * @property int $user_id
 * @property int|null $city_id
 * @property TrainingMode|null $mode
 * @property TrainingGoal|null $goal
 * @property Collection<int, PreferredTime>|null $times
 * @property list<int>|null $discipline_ids
 * @property int|null $budget_max_cents
 * @property int|null $birth_year
 * @property Sex|null $sex
 * @property FitnessLevel|null $fitness_level
 * @property TrainingExperience|null $training_experience
 * @property ActivityLevel|null $activity_level
 * @property int|null $sessions_per_week
 * @property list<string>|null $sports
 * @property string|null $trainer_note
 * @property int|null $height_cm
 * @property int|null $weight_kg
 * @property CarbonImmutable|null $body_data_consent_at
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property-read City|null $city
 */
#[Fillable([
    'city_id', 'mode', 'goal', 'times', 'discipline_ids', 'budget_max_cents',
    'birth_year', 'sex', 'fitness_level', 'training_experience', 'activity_level',
    'sessions_per_week', 'sports', 'trainer_note', 'height_cm', 'weight_kg', 'body_data_consent_at',
])]
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
            'birth_year' => 'integer',
            'sex' => Sex::class,
            'fitness_level' => FitnessLevel::class,
            'training_experience' => TrainingExperience::class,
            'activity_level' => ActivityLevel::class,
            'sessions_per_week' => 'integer',
            'sports' => 'array',
            'height_cm' => 'integer',
            'weight_kg' => 'integer',
            'body_data_consent_at' => 'datetime',
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
