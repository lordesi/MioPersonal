<?php

namespace App\Http\Controllers;

use Carbon\CarbonImmutable;
use Inertia\Inertia;
use Inertia\Response;

class TrainerProfileController extends Controller
{
    private const TIMEZONE = 'Europe/Rome';

    private const AVAILABILITY_DAYS = 21;

    public function __invoke(string $slug): Response
    {
        // TODO: load the approved trainer from the database by slug. A profile still
        // waiting for the team's approval is visible only to its trainer (preview) and to admins.
        abort_unless($slug === 'giulia-rossi', 404);

        return Inertia::render('public/profile', [
            'trainer' => $this->placeholderTrainer(),
        ]);
    }

    /**
     * Placeholder profile taken from docs/design until the trainers table exists.
     *
     * @return array<string, mixed>
     */
    private function placeholderTrainer(): array
    {
        return [
            'slug' => 'giulia-rossi',
            'name' => 'Giulia Rossi',
            'headline' => 'Functional training e Pilates',
            'verified' => true,
            'bio' => [
                'Laureata in Scienze Motorie, alleno da otto anni persone che vogliono tornare in forma dopo una pausa, migliorare la postura o prepararsi a una gara amatoriale.',
                "Nella prima seduta facciamo una valutazione insieme e fissiamo un obiettivo realistico. Poi ti preparo un programma su misura, da seguire con me o in autonomia tra una seduta e l'altra.",
            ],
            'experienceLabel' => '8 anni di esperienza',
            'responseTimeLabel' => 'Risponde di solito in 2 ore',
            'cancellationLabel' => 'Cancellazione gratuita fino a 24 ore prima',
            'rating' => 4.9,
            'reviewCount' => 23,
            'zones' => ['Città Studi', 'Lambrate', 'Porta Venezia'],
            'areaLabel' => 'Città Studi, Milano',
            'online' => 'also',
            'disciplines' => ['Functional', 'Pilates', 'Postura'],
            'photos' => [
                ['caption' => 'Ritratto', 'isPortrait' => true],
                ['caption' => 'In studio', 'isPortrait' => false],
                ['caption' => 'Al parco Lambro', 'isPortrait' => false],
                ['caption' => 'Seduta di Pilates', 'isPortrait' => false],
                ['caption' => 'Allenamento funzionale', 'isPortrait' => false],
                ['caption' => 'Lo studio', 'isPortrait' => false],
            ],
            'services' => [
                ['id' => 1, 'name' => 'Seduta singola', 'durationLabel' => '1 o 2 ore', 'note' => 'in studio, a domicilio o al parco', 'priceCents' => 4500, 'perHour' => true, 'fixedDuration' => false],
                ['id' => 2, 'name' => 'Seduta online', 'durationLabel' => '1 o 2 ore', 'note' => 'in videochiamata', 'priceCents' => 3500, 'perHour' => true, 'fixedDuration' => false],
                ['id' => 3, 'name' => 'Valutazione iniziale', 'durationLabel' => '1 ora', 'note' => 'test di partenza e obiettivi', 'priceCents' => 3000, 'perHour' => false, 'fixedDuration' => true],
                ['id' => 4, 'name' => 'Pacchetto 10 sedute', 'durationLabel' => '10 × 1 ora', 'note' => 'prenoti qui la prima, da usare entro 3 mesi', 'priceCents' => 40000, 'perHour' => false, 'fixedDuration' => true],
            ],
            'places' => [
                ['type' => 'studio', 'title' => 'Studio', 'detail' => 'Città Studi, via [indirizzo]'],
                ['type' => 'home', 'title' => 'A domicilio', 'detail' => 'Città Studi, Lambrate, Porta Venezia'],
                ['type' => 'park', 'title' => 'Al parco', 'detail' => 'Parco Lambro'],
                ['type' => 'online', 'title' => 'Online', 'detail' => 'In videochiamata'],
            ],
            'certifications' => [
                ['title' => 'Laurea in Scienze Motorie', 'issuer' => '[Università] · [anno]'],
                ['title' => 'Istruttrice di Pilates Matwork', 'issuer' => '[Ente certificatore] · [anno]'],
                ['title' => 'Primo soccorso BLSD', 'issuer' => '[Ente certificatore] · [anno]'],
            ],
            'ratingDistribution' => [
                ['stars' => 5, 'count' => 20],
                ['stars' => 4, 'count' => 3],
                ['stars' => 3, 'count' => 0],
                ['stars' => 2, 'count' => 0],
                ['stars' => 1, 'count' => 0],
            ],
            'reviews' => [
                ['id' => 1, 'authorName' => 'Marta', 'meta' => 'Seduta singola · settembre 2026', 'rating' => 5, 'text' => 'Puntuale e preparatissima. In un mese il mal di schiena è migliorato e ho finalmente una routine che riesco a seguire.', 'reply' => null],
                ['id' => 2, 'authorName' => 'Stefano', 'meta' => 'Pacchetto 10 sedute · agosto 2026', 'rating' => 5, 'text' => 'Allenamenti al parco sempre diversi. Ottima per chi riparte da zero.', 'reply' => 'Grazie Stefano, ci vediamo al parco per la prossima!'],
                ['id' => 3, 'authorName' => 'Ilaria', 'meta' => 'Seduta online · luglio 2026', 'rating' => 4, 'text' => 'Le sedute online funzionano bene, servirebbe solo un po’ più di materiale da seguire tra una seduta e l’altra.', 'reply' => 'Grazie del consiglio: da settembre mando una scheda dopo ogni seduta.'],
            ],
            'availability' => $this->placeholderAvailability(),
            'similarTrainers' => [
                ['name' => 'Andrea Conti', 'href' => route('trainers.show', 'andrea-conti', false), 'subtitle' => 'Lambrate · Calisthenics, Pesi', 'detail' => 'da 40 € · primo slot oggi 19:00'],
                ['name' => 'Elena Ricci', 'href' => route('trainers.show', 'elena-ricci', false), 'subtitle' => 'Monza · Pilates, Yoga', 'detail' => 'da 40 € · primo slot domani 09:00'],
                ['name' => 'Luca Ferrari', 'href' => route('trainers.show', 'luca-ferrari', false), 'subtitle' => 'Porta Romana · Crossfit', 'detail' => 'da 45 € · primo slot ven 9, 07:00'],
            ],
        ];
    }

    /**
     * Free start times for the next weeks, computed in Europe/Rome and sent as UTC.
     * maxHours is 2 when the following hour is free too.
     *
     * @return list<array{date: string, slots: list<array{start: string, maxHours: int}>}>
     */
    private function placeholderAvailability(): array
    {
        // Working hours by day of week (0 = Sunday), as in docs/design.
        $workingHours = [
            0 => [],
            1 => [7, 8, 9, 10, 11, 18, 19, 20],
            2 => [12, 13, 14, 15, 16, 17, 18, 19, 20],
            3 => [7, 8, 9, 10, 11, 18, 19, 20],
            4 => [12, 13, 14, 15, 16, 17, 18, 19, 20],
            5 => [7, 8, 9, 10, 11, 12],
            6 => [8, 9, 10, 11, 12, 13],
        ];

        $now = CarbonImmutable::now(self::TIMEZONE);
        $days = [];

        for ($index = 0; $index < self::AVAILABILITY_DAYS; $index++) {
            $date = $now->startOfDay()->addDays($index);
            $free = array_values(array_filter(
                $workingHours[$date->dayOfWeek],
                fn (int $hour) => ! $this->isBooked($index, $hour),
            ));

            $slots = [];

            foreach ($free as $hour) {
                $start = $date->setTime($hour, 0);

                if ($start->lessThanOrEqualTo($now)) {
                    continue;
                }

                $slots[] = [
                    'start' => $start->utc()->format('Y-m-d\TH:i:s\Z'),
                    'maxHours' => in_array($hour + 1, $free, true) ? 2 : 1,
                ];
            }

            $days[] = ['date' => $date->toDateString(), 'slots' => $slots];
        }

        return $days;
    }

    /** Same fake "already booked" rule as the design demo. */
    private function isBooked(int $dayIndex, int $hour): bool
    {
        return ($dayIndex * 7 + $hour * 13) % 10 < 3;
    }
}
