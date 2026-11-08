<?php

namespace App\Enums;

/** What an event is (group_sessions.type). `lesson`: a lesson of a gym's course, not chosen by hand. */
enum GroupSessionType: string
{
    case Training = 'training';
    case Workshop = 'workshop';
    case OpenDay = 'open_day';
    case Other = 'other';
    case Lesson = 'lesson';

    public function label(): string
    {
        return match ($this) {
            self::Training => 'Allenamento di gruppo',
            self::Workshop => 'Workshop',
            self::OpenDay => 'Open day',
            self::Other => 'Evento',
            self::Lesson => 'Lezione',
        };
    }

    /**
     * The types an organizer can choose (not the lessons of the courses).
     *
     * @return list<self>
     */
    public static function choosable(): array
    {
        return [self::Training, self::Workshop, self::OpenDay, self::Other];
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    public static function options(): array
    {
        return array_map(fn (self $type) => ['value' => $type->value, 'label' => $type->label()], self::choosable());
    }
}
