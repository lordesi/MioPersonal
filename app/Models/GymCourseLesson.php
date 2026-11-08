<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A weekly lesson of a course: "Lunedì 18:30–19:30, Sala 2". Called off on
 * a day with a GymCourseCancellation.
 *
 * @property int $id
 * @property int $gym_course_id
 * @property int $weekday 1 = Monday … 7 = Sunday
 * @property string $starts_at "18:30:00"
 * @property string $ends_at
 * @property string|null $room
 * @property int|null $capacity places, only shown
 * @property-read GymCourse $course
 * @property-read Collection<int, GymCourseCancellation> $cancellations
 */
#[Fillable(['weekday', 'starts_at', 'ends_at', 'room', 'capacity'])]
class GymCourseLesson extends Model
{
    public $timestamps = false;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'weekday' => 'integer',
            'capacity' => 'integer',
        ];
    }

    /** "18:30" */
    public function startTime(): string
    {
        return substr($this->starts_at, 0, 5);
    }

    /** "19:30" */
    public function endTime(): string
    {
        return substr($this->ends_at, 0, 5);
    }

    /**
     * @return BelongsTo<GymCourse, $this>
     */
    public function course(): BelongsTo
    {
        return $this->belongsTo(GymCourse::class, 'gym_course_id');
    }

    /**
     * @return HasMany<GymCourseCancellation, $this>
     */
    public function cancellations(): HasMany
    {
        return $this->hasMany(GymCourseCancellation::class);
    }
}
