<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/**
 * A weekly opening range of a gym, in Rome time, e.g. Monday 06:30–22:30.
 * "Aperta 24 ore" is 00:00–23:59.
 *
 * @property int $id
 * @property int $gym_profile_id
 * @property int $weekday 1 = Monday … 7 = Sunday
 * @property string $opens_at "HH:MM:SS"
 * @property string $closes_at "HH:MM:SS"
 */
#[Fillable(['weekday', 'opens_at', 'closes_at'])]
class GymOpeningHour extends Model
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

    /** "06:30". */
    public function opens(): string
    {
        return substr($this->opens_at, 0, 5);
    }

    /** "22:30". */
    public function closes(): string
    {
        return substr($this->closes_at, 0, 5);
    }
}
