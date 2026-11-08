<?php

namespace App\Actions\GroupSessions;

use App\Enums\GroupSessionPlace;
use App\Enums\GroupSessionStatus;
use App\Enums\GroupSessionType;
use App\Enums\GymLinkStatus;
use App\Models\GroupSession;
use App\Models\GymCourseLesson;
use App\Support\TrainerSlots;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * "Prenotazione posto" of a gym's course: each lesson on a day becomes an
 * event with the lesson's places (GroupSession with gym_course_lesson_id),
 * made the first time someone takes a place or the gym opens its clients.
 * It follows the lesson: new time or places, called off and restored.
 */
class CourseLessonSessions
{
    public function __construct(private CancelGroupSession $cancel) {}

    /** The event of the lesson on that day (Rome date), made if missing. */
    public function occurrence(GymCourseLesson $lesson, CarbonImmutable $date): GroupSession
    {
        $lesson->loadMissing('course.gymProfile');
        $course = $lesson->course;

        if ($date->dayOfWeekIso !== $lesson->weekday) {
            throw ValidationException::withMessages(['date' => 'Questa lezione non c’è quel giorno.']);
        }

        return DB::transaction(function () use ($lesson, $course, $date) {
            // Locks the lesson: two clients at once make one event.
            GymCourseLesson::query()->whereKey($lesson->id)->lockForUpdate()->first();

            $existing = GroupSession::query()
                ->where('gym_course_lesson_id', $lesson->id)
                ->whereDate('lesson_date', $date->toDateString())
                ->first();

            if ($existing !== null) {
                return $existing;
            }

            [$start, $end] = self::times($lesson, $date);
            $cancelled = $lesson->cancellations()->whereDate('date', $date->toDateString())->first();

            $session = GroupSession::create([
                'type' => GroupSessionType::Lesson,
                'title' => $course->name,
                'description' => $course->description,
                'discipline_id' => $course->discipline_id,
                'city_id' => $course->gymProfile->city_id,
                'place' => GroupSessionPlace::Gym,
                'gym_profile_id' => $course->gym_profile_id,
                'address' => $lesson->room,
                'starts_at' => $start->utc(),
                'ends_at' => $end->utc(),
                'capacity' => max(1, (int) $lesson->capacity),
                'price_cents' => 0,
                'gym_course_lesson_id' => $lesson->id,
                'lesson_date' => $date->toDateString(),
                'status' => $cancelled === null ? GroupSessionStatus::Published : GroupSessionStatus::Cancelled,
                'cancelled_at' => $cancelled === null ? null : now(),
                'cancel_note' => $cancelled?->note,
                'created_by_user_id' => $course->gymProfile->user_id,
            ]);

            $session->hosts()->create([
                'gym_profile_id' => $course->gym_profile_id,
                'is_owner' => true,
                'status' => GymLinkStatus::Accepted,
                'responded_at' => now(),
            ]);

            return $session;
        });
    }

    /**
     * The lesson changed: the next days follow its time and places; a new
     * weekday cancels them (the clients are told).
     */
    public function sync(GymCourseLesson $lesson): void
    {
        $lesson->loadMissing('course');

        foreach ($this->upcoming($lesson) as $session) {
            $date = CarbonImmutable::parse($session->lesson_date?->toDateString(), TrainerSlots::TIMEZONE);

            if ($date->dayOfWeekIso !== $lesson->weekday) {
                $this->cancel->cancel($session, SaveGroupSession::SCOPE_THIS, 'La lezione è stata spostata in un altro giorno.');

                continue;
            }

            [$start, $end] = self::times($lesson, $date);
            $registered = $session->activeRegistrations()->count();

            $session->update([
                'title' => $lesson->course->name,
                'starts_at' => $start->utc(),
                'ends_at' => $end->utc(),
                'address' => $lesson->room,
                // Never under the clients already in.
                'capacity' => max($registered, 1, (int) $lesson->capacity),
                'offline_seats' => min($session->offline_seats, max(0, max($registered, (int) $lesson->capacity) - $registered)),
            ]);
        }
    }

    /** The lesson (or its course) goes: its next days are cancelled, the clients told. */
    public function retire(GymCourseLesson $lesson, string $note = 'La lezione non è più in programma.'): void
    {
        foreach ($this->upcoming($lesson) as $session) {
            $this->cancel->cancel($session, SaveGroupSession::SCOPE_THIS, $note);
        }
    }

    /** "Annulla questa lezione". */
    public function cancelDate(GymCourseLesson $lesson, CarbonImmutable $date, ?string $note): void
    {
        $session = $this->find($lesson, $date);

        if ($session !== null && ! $session->isCancelled() && ! $session->hasStarted()) {
            $this->cancel->cancel($session, SaveGroupSession::SCOPE_THIS, $note);
        }
    }

    /** "Ripristina". */
    public function restoreDate(GymCourseLesson $lesson, CarbonImmutable $date): void
    {
        $session = $this->find($lesson, $date);

        if ($session !== null && ! $session->hasStarted()) {
            $this->cancel->restore($session);
        }
    }

    private function find(GymCourseLesson $lesson, CarbonImmutable $date): ?GroupSession
    {
        return GroupSession::query()
            ->where('gym_course_lesson_id', $lesson->id)
            ->whereDate('lesson_date', $date->toDateString())
            ->first();
    }

    /**
     * @return Collection<int, GroupSession>
     */
    private function upcoming(GymCourseLesson $lesson): Collection
    {
        return GroupSession::query()
            ->where('gym_course_lesson_id', $lesson->id)
            ->where('status', GroupSessionStatus::Published)
            ->upcoming()
            ->get();
    }

    /**
     * @return array{CarbonImmutable, CarbonImmutable} Rome time
     */
    private static function times(GymCourseLesson $lesson, CarbonImmutable $date): array
    {
        $day = $date->setTimezone(TrainerSlots::TIMEZONE)->startOfDay();
        [$startHour, $startMinute] = array_map(intval(...), explode(':', $lesson->startTime()));
        [$endHour, $endMinute] = array_map(intval(...), explode(':', $lesson->endTime()));

        return [$day->setTime($startHour, $startMinute), $day->setTime($endHour, $endMinute)];
    }
}
