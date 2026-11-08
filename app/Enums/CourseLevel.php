<?php

namespace App\Enums;

/** Who a course of a gym is for. Saved as text in `gym_courses.level`. */
enum CourseLevel: string
{
    case All = 'all';
    case Beginner = 'beginner';
    case Intermediate = 'intermediate';
    case Advanced = 'advanced';

    public function label(): string
    {
        return match ($this) {
            self::All => 'Per tutti',
            self::Beginner => 'Principianti',
            self::Intermediate => 'Intermedio',
            self::Advanced => 'Avanzato',
        };
    }

    /**
     * For the selects: [{value, label}].
     *
     * @return list<array{value: string, label: string}>
     */
    public static function options(): array
    {
        return array_map(fn (self $level) => ['value' => $level->value, 'label' => $level->label()], self::cases());
    }
}
