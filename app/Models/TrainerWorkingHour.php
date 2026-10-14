<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/**
 * A weekly working range, in Rome time, e.g. Monday 18:00–21:00.
 *
 * @property int $id
 * @property int $trainer_profile_id
 * @property int $weekday 1 = Monday … 7 = Sunday
 * @property string $starts_at "HH:MM:SS"
 * @property string $ends_at "HH:MM:SS"
 */
#[Fillable(['weekday', 'starts_at', 'ends_at'])]
class TrainerWorkingHour extends Model
{
    public $timestamps = false;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'weekday' => 'integer',
        ];
    }

    /**
     * Whole hours where a session can start: 18:00–21:00 → 18, 19, 20.
     *
     * @return list<int>
     */
    public function startHours(): array
    {
        return range((int) substr($this->starts_at, 0, 2), (int) substr($this->ends_at, 0, 2) - 1);
    }
}
