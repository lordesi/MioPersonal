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
 * plan of the week on the public profile. Only to look at: the gym's members
 * book it at the gym.
 *
 * @property int $id
 * @property int $gym_profile_id
 * @property string $name
 * @property string|null $description
 * @property int|null $discipline_id
 * @property CourseLevel $level
 * @property int|null $instructor_trainer_id a trainer of MioPersonal who works at the gym
 * @property string|null $instructor_name an instructor without a profile
 * @property bool $is_active off: kept, not shown
 * @property int $sort
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property-read GymProfile $gymProfile
 * @property-read Discipline|null $discipline
 * @property-read TrainerProfile|null $instructor
 * @property-read Collection<int, GymCourseLesson> $lessons
 * @property-read Collection<int, GymCoursePhoto> $photos
 */
#[Fillable([
    'name', 'description', 'discipline_id', 'level', 'instructor_trainer_id', 'instructor_name',
    'is_active', 'sort',
])]
class GymCourse extends Model
{
    public const NAME_MAX = 80;

    public const DESCRIPTION_MAX = 1000;

    /** Lessons of a course in a week. */
    public const MAX_LESSONS = 21;

    /** Photos of a course. */
    public const MAX_PHOTOS = 6;

    protected static function booted(): void
    {
        // The files go with the course (the rows go by cascade).
        static::deleting(function (GymCourse $course) {
            Storage::disk(GymPhoto::DISK)->delete($course->photos()->pluck('path')->all());
        });
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'level' => CourseLevel::class,
            'is_active' => 'boolean',
            'sort' => 'integer',
        ];
    }

    /** The first photo: the one on the cards. */
    public function photoUrl(): ?string
    {
        return $this->photos->first()?->url();
    }

    /**
     * @return list<string>
     */
    public function photoUrls(): array
    {
        return array_values($this->photos->map(fn (GymCoursePhoto $photo) => $photo->url())->all());
    }

    /** "Max 15 posti": the most places of its lessons, null when none says. */
    public function maxPlaces(): ?int
    {
        $max = $this->lessons->max('capacity');

        return $max === null ? null : (int) $max;
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

    /**
     * The first one is on the cards.
     *
     * @return HasMany<GymCoursePhoto, $this>
     */
    public function photos(): HasMany
    {
        return $this->hasMany(GymCoursePhoto::class)->orderBy('sort')->orderBy('id');
    }
}
