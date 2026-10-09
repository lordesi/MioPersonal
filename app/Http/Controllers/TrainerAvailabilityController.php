<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\BuildsPlaceholderData;
use Inertia\Inertia;
use Inertia\Response;

class TrainerAvailabilityController extends Controller
{
    use BuildsPlaceholderData;

    public function __invoke(): Response
    {
        // TODO: load working hours and booking rules from the database.
        $year = $this->romeNow()->year;

        $day = fn (int $day, string $label, array $ranges) => [
            'day' => $day,
            'label' => $label,
            'enabled' => $ranges !== [],
            'ranges' => array_map(fn (array $range) => ['from' => $range[0], 'to' => $range[1]], $ranges),
        ];

        return Inertia::render('trainer/availability', [
            'trainerArea' => $this->trainerArea(),
            'weekdays' => [
                $day(1, 'Lunedì', [['07:00', '12:00'], ['18:00', '21:00']]),
                $day(2, 'Martedì', [['12:00', '21:00']]),
                $day(3, 'Mercoledì', [['07:00', '12:00'], ['18:00', '21:00']]),
                $day(4, 'Giovedì', [['12:00', '21:00']]),
                $day(5, 'Venerdì', [['07:00', '13:00']]),
                $day(6, 'Sabato', [['08:00', '14:00']]),
                $day(7, 'Domenica', []),
            ],
            'durations' => [1, 2],
            'holidays' => [
                ['id' => 1, 'from' => "{$year}-12-24", 'to' => ($year + 1).'-01-06'],
            ],
            'autoConfirm' => false,
            'rules' => [
                'noticeHours' => 12,
                'bookingWindowDays' => 60,
                'breakMinutes' => 15,
                'travelMinutes' => 30,
                'maxSessionsPerDay' => 6,
                'confirmHours' => 24,
                'freeCancellationHours' => 24,
            ],
        ]);
    }
}
