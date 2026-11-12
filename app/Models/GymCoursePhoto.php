<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

/**
 * A photo of a gym's course, on the disk of GymPhoto. The first one (lowest
 * sort) is the one on the cards.
 *
 * @property int $id
 * @property int $gym_course_id
 * @property string $path
 * @property int $sort
 * @property-read GymCourse $course
 */
#[Fillable(['path', 'sort'])]
class GymCoursePhoto extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'sort' => 'integer',
        ];
    }

    public function url(): string
    {
        return Storage::disk(GymPhoto::DISK)->url($this->path);
    }

    /**
     * @return BelongsTo<GymCourse, $this>
     */
    public function course(): BelongsTo
    {
        return $this->belongsTo(GymCourse::class, 'gym_course_id');
    }
}
