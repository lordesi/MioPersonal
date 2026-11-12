<?php

namespace App\Support;

use App\Models\GymCourse;

/**
 * A course of a gym in the format of the search cards (CourseSummary in
 * resources/js/types/gym.ts). A course has no page of its own: the card
 * opens the gym's plan, filtered on it (?corso=).
 */
final class CourseCard
{
    /** The relations a card reads: load them to avoid one query per card. */
    public const RELATIONS = ['discipline', 'instructor.user', 'lessons', 'gymProfile.city', 'gymProfile.cover'];

    /**
     * @return array<string, mixed>
     */
    public static function from(GymCourse $course): array
    {
        $gym = $course->gymProfile;
        $instructor = $course->instructor;

        return [
            'id' => $course->id,
            'name' => $course->name,
            'href' => self::href($course),
            'photoUrl' => $course->photoUrl() ?? $gym->cover?->url(),
            'level' => $course->level->label(),
            'discipline' => $course->discipline?->name,
            'instructor' => $course->instructorLabel(),
            'instructorHref' => $instructor !== null && $instructor->isApproved() ? route('trainers.show', $instructor->slug, false) : null,
            // "Lun, Gio 18:30 · Sab 10:00"
            'when' => GymCourseWeek::when($course),
            // "Prenotazione posto": a place is taken here, confirmed at once.
            'bookable' => $course->bookable && $course->lessons->contains(fn ($lesson) => $lesson->capacity !== null),
            'gym' => [
                'name' => $gym->name,
                'slug' => $gym->slug,
                'city' => $gym->city->name,
                'href' => route('gyms.show', $gym->slug, false),
            ],
        ];
    }

    /** The gym's page, with the plan of the course open. */
    public static function href(GymCourse $course): string
    {
        return route('gyms.show', [$course->gymProfile->slug, 'corso' => $course->id], false).'#corsi';
    }

    /**
     * @param  iterable<GymCourse>  $courses
     * @return list<array<string, mixed>>
     */
    public static function many(iterable $courses): array
    {
        $cards = [];

        foreach ($courses as $course) {
            $cards[] = self::from($course);
        }

        return $cards;
    }
}
