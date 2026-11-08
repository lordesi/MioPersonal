<?php

namespace App\Models;

use App\Enums\CourseLevel;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

/**
 * A course of a gym ("Pilates", "Spinning") with its weekly lessons: the
 * plan of the week on the public profile. Booked at the gym, or on
 * MioPersonal with "Prenotazione posto" (bookable).
 *
 * @property int $id
 * @property int $gym_profile_id
 * @property string $name
 * @property string|null $description
 * @property int|null $discipline_id
 * @property CourseLevel $level
 * @property int|null $instructor_trainer_id a trainer of MioPersonal who works at the gym
 * @property string|null $instructor_name an instructor without a profile
 * @property string|null $photo_path on the disk of GymPhoto
 * @property bool $is_active off: kept, not shown
 * @property bool $bookable "Prenotazione posto": clients take a place in each lesson
 * @property int $sort
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property-read GymProfile $gymProfile
 * @property-read Discipline|null $discipline
 * @property-read TrainerProfile|null $instructor
 * @property-read Collection<int, GymCourseLesson> $lessons
 */
#[Fillable([
    'name', 'description', 'discipline_id', 'level', 'instructor_trainer_id', 'instructor_name',
    'photo_path', 'is_active', 'bookable', 'sort',
])]
class GymCourse extends Model
{
    public const NAME_MAX = 80;

    public const DESCRIPTION_MAX = 1000;

    /** Lessons of a course in a week. */
    public const MAX_LESSONS = 21;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'level' => CourseLevel::class,
            'is_active' => 'boolean',
            'bookable' => 'boolean',
            'sort' => 'integer',
        ];
    }

    public function photoUrl(): ?string
    {
        return $this->photo_path === null ? null : Storage::disk(GymPhoto::DISK)->url($this->photo_path);
    }

    /** "Marco Bianchi": the trainer of MioPersonal, or the name written by the gym. */
    public function instructorLabel(): ?string
    {
        return $this->instructor?->user->name ?? $this->instructor_name;
    }

    /**
     * @return BelongsTo<GymProfile, $this>
     */
    public function gymProfile(): BelongsTo
    {
        return $this->belongsTo(GymProfile::class);
    }

    /**
     * @return BelongsTo<Discipline, $this>
     */
    public function discipline(): BelongsTo
    {
        return $this->belongsTo(Discipline::class);
    }

    /**
     * @return BelongsTo<TrainerProfile, $this>
     */
    public function instructor(): BelongsTo
    {
        return $this->belongsTo(TrainerProfile::class, 'instructor_trainer_id');
    }

    /**
     * Monday first, then by time.
     *
     * @return HasMany<GymCourseLesson, $this>
     */
    public function lessons(): HasMany
    {
        return $this->hasMany(GymCourseLesson::class)->orderBy('weekday')->orderBy('starts_at');
    }
}
