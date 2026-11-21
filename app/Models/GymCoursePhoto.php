<?php

namespace App\Models;

use App\Support\SafeImage;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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

    /** @param  'sm'|'md'|'lg'|null  $size  a lighter copy (SafeImage::VARIANTS); null = the original */
    public function url(?string $size = null): string
    {
        return SafeImage::url(GymPhoto::DISK, $this->path, $size);
    }

    /**
     * @return BelongsTo<GymCourse, $this>
     */
    public function course(): BelongsTo
    {
        return $this->belongsTo(GymCourse::class, 'gym_course_id');
    }
}
