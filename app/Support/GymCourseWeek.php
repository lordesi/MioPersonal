<?php

namespace App\Support;

use App\Models\GroupSession;
use App\Models\GymCourse;
use App\Models\GymCourseCancellation;
use App\Models\GymCourseLesson;
use App\Models\GymProfile;
use App\Models\User;
use Carbon\CarbonImmutable;

/**
 * The plan of a week of a gym's courses (GymCourseWeek in
 * resources/js/types/gym.ts): 7 Rome days from Monday, each with its lessons
 * by time, the ones called off that day marked. Active courses only.
 */
final class GymCourseWeek
{
    /** Days in Italian, Monday first. */
    private const DAYS = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

    /** The Monday of this week, in Rome. */
    public static function thisMonday(): CarbonImmutable
    {
        return CarbonImmutable::now(TrainerSlots::TIMEZONE)->startOfWeek(CarbonImmutable::MONDAY)->startOfDay();
    }

    /**
     * @param  bool  $withHidden  the gym area also sees the courses switched off
     * @param  User|null  $viewer  marks the lessons where this client has a place
     * @return list<array<string, mixed>>
     */
    public static function days(GymProfile $gym, CarbonImmutable $monday, bool $withHidden = false, ?User $viewer = null): array
    {
        $sunday = $monday->addDays(6);
        $courses = $gym->courses()
            ->when(! $withHidden, fn ($query) => $query->where('is_active', true))
            ->with([
                'discipline',
                'instructor.user',
                'lessons.cancellations' => fn ($query) => $query->whereBetween('date', [$monday->toDateString(), $sunday->toDateString()]),
            ])
            ->get();

        // "Prenotazione posto": the lessons with places already taken this week.
        $sessions = GroupSession::query()
            ->whereIn('gym_course_lesson_id', $courses->flatMap(fn (GymCourse $course) => $course->lessons->pluck('id')))
            ->whereBetween('lesson_date', [$monday->toDateString(), $sunday->toDateString()])
            ->withCount('activeRegistrations as registered_count')
            ->with(['activeRegistrations' => fn ($query) => $query->where('user_id', $viewer->id ?? 0)])
            ->get()
            ->keyBy(fn (GroupSession $session) => $session->gym_course_lesson_id.'@'.$session->lesson_date?->toDateString());
        $now = CarbonImmutable::now(TrainerSlots::TIMEZONE);
        $days = [];

        foreach (range(1, 7) as $weekday) {
            $date = $monday->addDays($weekday - 1);
            $lessons = [];

            foreach ($courses as $course) {
                foreach ($course->lessons->where('weekday', $weekday) as $lesson) {
                    /** @var GymCourseCancellation|null $cancellation */
                    $cancellation = $lesson->cancellations->first(fn (GymCourseCancellation $item) => $item->date->isSameDay($date));
                    $lessons[] = [
                        ...self::lesson($course, $lesson, $cancellation),
                        ...self::places($course, $lesson, $date, $sessions->get($lesson->id.'@'.$date->toDateString()), $now),
                    ];
                }
            }

            usort($lessons, fn (array $a, array $b) => [$a['start'], $a['name']] <=> [$b['start'], $b['name']]);

            $days[] = [
                'date' => $date->toDateString(),
                'label' => self::DAYS[$weekday - 1],
                'lessons' => $lessons,
            ];
        }

        return $days;
    }

    /**
     * "Prenotazione posto": places left, the viewer's place, and the event of
     * the lesson that day (for the gym's "Iscritti").
     *
     * @return array{bookable: bool, remaining: int|null, booked: bool, started: bool, eventSlug: string|null, registered: int}
     */
    private static function places(GymCourse $course, GymCourseLesson $lesson, CarbonImmutable $date, ?GroupSession $session, CarbonImmutable $now): array
    {
        $bookable = $course->bookable && $lesson->capacity !== null;
        [$hour, $minute] = array_map(intval(...), explode(':', $lesson->startTime()));

        return [
            'bookable' => $bookable,
            'remaining' => ! $bookable ? null : ($session?->remainingSeats() ?? $lesson->capacity),
            'booked' => $session !== null && $session->activeRegistrations->isNotEmpty(),
            'started' => $date->setTime($hour, $minute)->lte($now),
            'eventSlug' => $session?->slug,
            'registered' => $session?->registeredCount() ?? 0,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private static function lesson(GymCourse $course, GymCourseLesson $lesson, ?GymCourseCancellation $cancellation): array
    {
        $instructor = $course->instructor;

        return [
            'lessonId' => $lesson->id,
            'courseId' => $course->id,
            'name' => $course->name,
            'start' => $lesson->startTime(),
            'end' => $lesson->endTime(),
            'room' => $lesson->room,
            'capacity' => $lesson->capacity,
            'level' => $course->level->label(),
            'discipline' => $course->discipline?->name,
            'instructor' => $course->instructorLabel(),
            // Only for a trainer with a public profile.
            'instructorHref' => $instructor !== null && $instructor->isApproved() ? route('trainers.show', $instructor->slug, false) : null,
            'cancelled' => $cancellation !== null,
            'cancelNote' => $cancellation?->note,
        ];
    }

    /**
     * The courses, for the details under the plan: photo, description, when.
     *
     * @return list<array<string, mixed>>
     */
    public static function courses(GymProfile $gym): array
    {
        return array_values($gym->courses()
            ->where('is_active', true)
            ->with(['discipline', 'instructor.user', 'lessons'])
            ->get()
            ->filter(fn (GymCourse $course) => $course->lessons->isNotEmpty())
            ->map(fn (GymCourse $course) => [
                'id' => $course->id,
                'name' => $course->name,
                'description' => $course->description,
                'photoUrl' => $course->photoUrl(),
                'level' => $course->level->label(),
                'discipline' => $course->discipline?->name,
                'instructor' => $course->instructorLabel(),
                // "Lun, Mer 18:30"
                'when' => self::when($course),
            ])->all());
    }

    /** "Lun e Gio 18:30 · Sab 10:00": the weekly lessons grouped by time. */
    public static function when(GymCourse $course): string
    {
        $short = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
        $byTime = [];

        foreach ($course->lessons as $lesson) {
            $byTime[$lesson->startTime()][] = $short[$lesson->weekday - 1];
        }

        ksort($byTime);

        return implode(' · ', array_map(
            fn (string $time, array $days) => implode(', ', array_unique($days))." {$time}",
            array_keys($byTime),
            $byTime,
        ));
    }
}
