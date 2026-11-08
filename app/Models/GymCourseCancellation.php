<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * "Annullata": a weekly lesson that doesn't take place on one day.
 *
 * @property int $id
 * @property int $gym_course_lesson_id
 * @property CarbonImmutable $date the Rome day
 * @property string|null $note "Istruttore in ferie"
 * @property-read GymCourseLesson $lesson
 */
#[Fillable(['date', 'note'])]
class GymCourseCancellation extends Model
{
    public const NOTE_MAX = 120;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'date' => 'immutable_date',
        ];
    }

    /**
     * @return BelongsTo<GymCourseLesson, $this>
     */
    public function lesson(): BelongsTo
    {
        return $this->belongsTo(GymCourseLesson::class, 'gym_course_lesson_id');
    }
}
