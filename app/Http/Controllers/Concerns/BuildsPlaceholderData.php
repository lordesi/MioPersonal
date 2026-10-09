<?php

namespace App\Http\Controllers\Concerns;

use Carbon\CarbonImmutable;

/**
 * Helpers for the placeholder data shown until the real tables exist.
 * TODO: delete once every page reads from the database.
 *
 * @phpstan-type PlaceholderTrainer array{
 *     slug: string,
 *     name: string,
 *     zone: string,
 *     area: string,
 *     zoneSlug: string|null,
 *     zoneGroup: string|null,
 *     disciplines: list<string>,
 *     rating: float|null,
 *     reviewCount: int,
 *     priceFromCents: int,
 *     places: list<string>,
 *     times: list<string>,
 *     goals: list<string>,
 *     nextSlotInDays: int,
 *     nextSlotLabel: string,
 * }
 */
trait BuildsPlaceholderData
{
    private function romeNow(): CarbonImmutable
    {
        return CarbonImmutable::now('Europe/Rome');
    }

    /** A Rome date `$days` from today at `$hour`:`$minute`. */
    private function at(CarbonImmutable $now, int $days, int $hour, int $minute = 0): CarbonImmutable
    {
        return $now->startOfDay()->addDays($days)->setTime($hour, $minute);
    }

    /** Dates go to the frontend in UTC; the browser shows them in Europe/Rome. */
    private function iso(CarbonImmutable $date): string
    {
        return $date->utc()->format('Y-m-d\TH:i:s\Z');
    }

    /**
     * Data the trainer layout needs on every page of the trainer area.
     *
     * @return array{pendingCount: int, publicProfileHref: string}
     */
    private function trainerArea(): array
    {
        return [
            'pendingCount' => 3,
            'publicProfileHref' => route('trainers.show', 'giulia-rossi', false),
        ];
    }

    /**
     * The trainers of the search and quiz designs, shared by both pages.
     *
     * - zoneSlug: the zone filter of the search (null = online only).
     * - zoneGroup: the area matched by the quiz "Zona" answer.
     * - places: studio, home, park, online.
     * - times: early-morning, morning, lunch, afternoon, evening, weekend.
     * - goals: fitness, strength, posture, sport, wellbeing.
     *
     * @return list<PlaceholderTrainer>
     */
    private function placeholderTrainers(): array
    {
        $now = $this->romeNow();

        // slug, name, area, zoneSlug, zoneGroup, disciplines, rating, reviews, price in cents,
        // places, times, goals, [days from today, hour, minute] of the first free slot.
        $trainers = [
            ['giulia-rossi', 'Giulia Rossi', 'Città Studi', 'citta-studi', 'citta-studi-lambrate', ['Functional', 'Pilates'], 4.9, 23, 4500, ['studio', 'home', 'park', 'online'], ['evening', 'morning', 'afternoon'], ['fitness', 'posture'], [1, 18, 0]],
            ['marco-bianchi', 'Marco Bianchi', 'Navigli', 'navigli', 'navigli-porta-romana', ['Pesi', 'Preparazione atletica'], 4.8, 31, 5000, ['studio'], ['lunch', 'afternoon', 'evening'], ['strength', 'sport'], [2, 13, 0]],
            ['sara-colombo', 'Sara Colombo', 'Solo online', null, null, ['Yoga', 'Pilates'], 5.0, 12, 3000, ['online'], ['early-morning', 'lunch', 'evening'], ['wellbeing', 'posture'], [0, 19, 30]],
            ['luca-ferrari', 'Luca Ferrari', 'Porta Romana', 'porta-romana', 'navigli-porta-romana', ['Crossfit', 'Functional'], 4.7, 18, 4500, ['studio', 'park'], ['early-morning', 'evening'], ['sport', 'fitness'], [4, 7, 0]],
            ['elena-ricci', 'Elena Ricci', 'Monza', 'monza', 'provincia', ['Pilates', 'Yoga'], null, 0, 4000, ['studio', 'home', 'online'], ['morning', 'afternoon'], ['posture', 'wellbeing'], [1, 9, 0]],
            ['davide-greco', 'Davide Greco', 'Sesto San Giovanni', 'sesto-san-giovanni', 'provincia', ['Boxe', 'Functional'], 4.9, 9, 3500, ['studio', 'home'], ['afternoon', 'evening', 'weekend'], ['wellbeing', 'fitness'], [0, 20, 0]],
            ['chiara-galli', 'Chiara Galli', 'CityLife', 'citylife', 'citylife-san-siro', ['Yoga'], 4.8, 27, 3800, ['park', 'online'], ['morning', 'weekend'], ['wellbeing'], [3, 9, 0]],
            ['andrea-conti', 'Andrea Conti', 'Lambrate', 'lambrate', 'citta-studi-lambrate', ['Calisthenics', 'Pesi'], 4.6, 14, 4000, ['home', 'park', 'online'], ['early-morning', 'evening', 'weekend'], ['strength', 'fitness'], [0, 19, 0]],
            ['francesca-marino', 'Francesca Marino', 'Brera', 'brera', 'centro', ['Preparazione atletica', 'Pesi'], null, 0, 5500, ['studio', 'home'], ['early-morning', 'lunch'], ['sport', 'strength'], [6, 10, 0]],
        ];

        $result = [];

        foreach ($trainers as [$slug, $name, $area, $zoneSlug, $zoneGroup, $disciplines, $rating, $reviewCount, $price, $places, $times, $goals, [$days, $hour, $minute]]) {
            $result[] = [
                'slug' => $slug,
                'name' => $name,
                // Milan neighbourhoods get ", Milano"; towns and "Solo online" stay as they are.
                'zone' => in_array($zoneGroup, ['provincia', null], true) ? $area : "{$area}, Milano",
                'area' => $area,
                'zoneSlug' => $zoneSlug,
                'zoneGroup' => $zoneGroup,
                'disciplines' => $disciplines,
                'rating' => $rating,
                'reviewCount' => $reviewCount,
                'priceFromCents' => $price,
                'places' => $places,
                'times' => $times,
                'goals' => $goals,
                'nextSlotInDays' => $days,
                'nextSlotLabel' => $this->slotLabel($days, $this->at($now, $days, $hour, $minute)),
            ];
        }

        return $result;
    }

    /** "oggi 19:30", "domani 18:00" or "mer 7, 13:00", in Rome time. */
    private function slotLabel(int $days, CarbonImmutable $slot): string
    {
        $weekdays = ['lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom'];

        $day = match ($days) {
            0 => 'oggi',
            1 => 'domani',
            default => "{$weekdays[$slot->dayOfWeekIso - 1]} {$slot->day},",
        };

        return "{$day} {$slot->format('H:i')}";
    }

    /**
     * A placeholder trainer in the format of the search and home cards.
     *
     * @param  PlaceholderTrainer  $trainer
     * @return array<string, mixed>
     */
    private function trainerCard(array $trainer): array
    {
        $inPerson = $this->trainsInPerson($trainer);
        $online = $this->trainsOnline($trainer);

        return [
            'name' => $trainer['name'],
            'href' => route('trainers.show', $trainer['slug'], false),
            'zone' => $trainer['zone'],
            'disciplines' => $trainer['disciplines'],
            'rating' => $trainer['rating'],
            'reviewCount' => $trainer['reviewCount'],
            'priceFromCents' => $trainer['priceFromCents'],
            'nextSlotLabel' => $trainer['nextSlotLabel'],
            'online' => $online ? ($inPerson ? 'also' : 'only') : null,
        ];
    }

    /** @param  PlaceholderTrainer  $trainer */
    private function trainsInPerson(array $trainer): bool
    {
        return array_diff($trainer['places'], ['online']) !== [];
    }

    /** @param  PlaceholderTrainer  $trainer */
    private function trainsOnline(array $trainer): bool
    {
        return in_array('online', $trainer['places'], true);
    }
}
