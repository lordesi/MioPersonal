<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\BuildsPlaceholderData;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Inertia\Inertia;
use Inertia\Response;

class TrainerCalendarController extends Controller
{
    use BuildsPlaceholderData;

    public function __invoke(): Response
    {
        // TODO: load the trainer's bookings and synced calendars from the database.
        $now = $this->romeNow();
        $monday = $now->startOfWeek(CarbonInterface::MONDAY);
        $events = $this->events($monday);

        return Inertia::render('trainer/calendar', [
            'trainerArea' => $this->trainerArea(),
            'weekStart' => $monday->toDateString(),
            'events' => $events,
            'syncs' => [
                ['id' => 'google', 'name' => 'Google Calendar', 'connected' => true, 'status' => 'Aggiornato 2 min fa · nessun conflitto'],
                ['id' => 'apple', 'name' => 'Calendario Apple', 'connected' => false, 'status' => 'Tramite link iCloud'],
            ],
            'sessionCounts' => $this->sessionCounts($now, $events),
        ]);
    }

    /**
     * The week of the design demo, moved to the current week.
     *
     * @return list<array{id: int, start: string, end: string, title: string, detail: string, place: string, kind: string, source: string|null}>
     */
    private function events(CarbonImmutable $monday): array
    {
        $rows = [
            [0, 7.5, 8.5, 'Anna B.', 'Seduta singola', 'Parco Lambro', 'confirmed', null],
            [0, 12, 13, 'Roberto C.', 'Pacchetto 10 · 7ª seduta', 'Studio', 'confirmed', null],
            [0, 18, 19, 'Luca M.', 'Valutazione iniziale', 'Studio', 'confirmed', null],
            [0, 19.5, 20.5, 'Paolo R.', 'Seduta online', 'Videochiamata', 'confirmed', null],
            [1, 7, 8, 'Anna B.', 'Seduta singola', 'Parco Lambro', 'confirmed', null],
            [1, 13, 14, 'Impegno personale', 'Da Google Calendar', '', 'busy', 'google'],
            [1, 18, 19, 'Francesca D.', 'Seduta singola · 1 ora', 'Al parco · Parco Lambro', 'pending', null],
            [2, 9, 10, 'Marta S.', 'Seduta singola', 'A domicilio · Città Studi', 'confirmed', null],
            [2, 18, 20, 'Stefano V.', 'Seduta singola · 2 ore', 'Parco Lambro', 'confirmed', null],
            [3, 7, 9, 'Marco P.', 'Seduta singola · 2 ore', 'A domicilio · Lambrate', 'pending', null],
            [3, 9, 10, 'Dentista', 'Da Calendario Apple', '', 'busy', 'apple'],
            [3, 12, 13, 'Roberto C.', 'Pacchetto 10 · 8ª seduta', 'Studio', 'confirmed', null],
            [4, 7.5, 8.5, 'Anna B.', 'Seduta singola', 'Parco Lambro', 'confirmed', null],
            [4, 18, 19, 'Ilaria P.', 'Seduta online', 'Videochiamata', 'confirmed', null],
            [5, 9, 10, 'Marta S.', 'Seduta singola', 'A domicilio · Città Studi', 'confirmed', null],
            [5, 10, 11, 'Sofia L.', 'Seduta online · 1 ora', 'Videochiamata', 'pending', null],
        ];

        $events = [];

        foreach ($rows as $index => [$day, $from, $to, $title, $detail, $place, $kind, $source]) {
            $events[] = [
                'id' => $index + 1,
                'start' => $this->iso($this->at($monday, $day, (int) $from, (int) (fmod($from, 1) * 60))),
                'end' => $this->iso($this->at($monday, $day, (int) $to, (int) (fmod($to, 1) * 60))),
                'title' => $title,
                'detail' => $detail,
                'place' => $place,
                'kind' => $kind,
                'source' => $source,
            ];
        }

        return $events;
    }

    /**
     * Confirmed sessions per day, from this month to two months ahead.
     * Days outside the demo week get a fake but stable number.
     *
     * @param  list<array{start: string, kind: string}>  $events
     * @return array<string, int>
     */
    private function sessionCounts(CarbonImmutable $now, array $events): array
    {
        $real = [];

        foreach ($events as $event) {
            if ($event['kind'] === 'confirmed') {
                $day = CarbonImmutable::parse($event['start'])->setTimezone('Europe/Rome')->toDateString();
                $real[$day] = ($real[$day] ?? 0) + 1;
            }
        }

        $monday = $now->startOfWeek(CarbonInterface::MONDAY);
        $counts = [];

        for ($date = $now->startOfMonth(); $date->lessThanOrEqualTo($now->addMonths(2)->endOfMonth()); $date = $date->addDay()) {
            $key = $date->toDateString();
            $inDemoWeek = $date->betweenIncluded($monday, $monday->addDays(6));

            $counts[$key] = match (true) {
                $inDemoWeek => $real[$key] ?? 0,
                $date->isSunday() => 0,
                $date->isSaturday() => $date->day % 3,
                default => ($date->day * 5 + $date->month * 3) % 7,
            };
        }

        return $counts;
    }
}
