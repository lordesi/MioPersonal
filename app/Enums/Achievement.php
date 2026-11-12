<?php

namespace App\Enums;

/**
 * "Traguardi": about keeping at it and trying new things, never about
 * performance. No points, levels or rankings. The order is the one shown.
 */
enum Achievement: string
{
    case FirstSession = 'first_session';
    case FirstLog = 'first_log';
    case FirstEvent = 'first_event';
    case Weeks4 = 'weeks_4';
    case Weeks12 = 'weeks_12';
    case Weeks26 = 'weeks_26';
    case Weeks52 = 'weeks_52';
    case Trainings10 = 'trainings_10';
    case Trainings25 = 'trainings_25';
    case Trainings50 = 'trainings_50';
    case Trainings100 = 'trainings_100';
    case Disciplines3 = 'disciplines_3';

    public function title(): string
    {
        return match ($this) {
            self::FirstSession => 'Prima seduta',
            self::FirstLog => 'Primo allenamento segnato',
            self::FirstEvent => 'Primo corso o evento',
            self::Weeks4 => '4 settimane di fila',
            self::Weeks12 => '12 settimane di fila',
            self::Weeks26 => '26 settimane di fila',
            self::Weeks52 => 'Un anno di fila',
            self::Trainings10 => '10 allenamenti',
            self::Trainings25 => '25 allenamenti',
            self::Trainings50 => '50 allenamenti',
            self::Trainings100 => '100 allenamenti',
            self::Disciplines3 => '3 discipline diverse',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::FirstSession => 'La prima seduta con un trainer di MioPersonal.',
            self::FirstLog => 'Il primo allenamento segnato nel diario.',
            self::FirstEvent => 'Il primo corso o evento di gruppo.',
            self::Weeks4, self::Weeks12, self::Weeks26, self::Weeks52 => 'Settimane di fila con l’obiettivo raggiunto.',
            self::Trainings10, self::Trainings25, self::Trainings50, self::Trainings100 => 'Sedute, corsi e allenamenti segnati, tutti insieme.',
            self::Disciplines3 => 'Tre modi diversi di allenarsi.',
        };
    }

    /**
     * What it counts and how much it takes; null for the "first" ones.
     *
     * @return array{measure: 'streak'|'total'|'disciplines', target: int}|null
     */
    public function goal(): ?array
    {
        return match ($this) {
            self::Weeks4 => ['measure' => 'streak', 'target' => 4],
            self::Weeks12 => ['measure' => 'streak', 'target' => 12],
            self::Weeks26 => ['measure' => 'streak', 'target' => 26],
            self::Weeks52 => ['measure' => 'streak', 'target' => 52],
            self::Trainings10 => ['measure' => 'total', 'target' => 10],
            self::Trainings25 => ['measure' => 'total', 'target' => 25],
            self::Trainings50 => ['measure' => 'total', 'target' => 50],
            self::Trainings100 => ['measure' => 'total', 'target' => 100],
            self::Disciplines3 => ['measure' => 'disciplines', 'target' => 3],
            default => null,
        };
    }
}
