<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * The client's weight on a day, for the trend in "Panoramica". Health data
 * (GDPR art. 9): only with `client_preferences.body_data_consent_at`, and
 * deleted when the consent is withdrawn (CompleteProfileController::update).
 *
 * @property int $id
 * @property int $user_id
 * @property string $measured_on Rome day, "2026-11-12" (no date cast: compared as text)
 * @property int $weight_grams
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property-read User $user
 */
#[Fillable(['measured_on', 'weight_grams'])]
class BodyMeasurement extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'weight_grams' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
