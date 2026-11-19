<?php

namespace App\Models;

use App\Support\WorkingRanges;
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
     * The range in minutes from midnight: 07:30–12:00 → [450, 720].
     *
     * @return array{int, int}
     */
    public function range(): array
    {
        return [WorkingRanges::fromTime($this->starts_at), WorkingRanges::fromTime($this->ends_at)];
    }
}
