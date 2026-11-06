<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A day with its own hours instead of the weekly ones ("Giorni e settimane
 * diverse" in "Disponibilità"); no hours = closed that day.
 *
 * @property int $id
 * @property int $trainer_profile_id
 * @property CarbonImmutable $date the Rome date
 * @property list<int> $hours start hours, 6 … 23; [] = closed
 * @property string|null $note
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 */
#[Fillable(['date', 'hours', 'note'])]
class TrainerDayOverride extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'date' => 'date',
            'hours' => 'array',
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
