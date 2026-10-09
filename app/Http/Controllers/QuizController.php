<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\BuildsPlaceholderData;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Trova il tuo trainer": 7 questions, then the 3 most compatible trainers.
 * The questions and their texts live in resources/js/lib/quiz.ts; here we only
 * check the answers and compute the compatibility.
 *
 * @phpstan-import-type PlaceholderTrainer from BuildsPlaceholderData
 *
 * @phpstan-type QuizAnswers array{
 *     goal: string|null,
 *     disciplines: list<string>,
 *     places: list<string>,
 *     zone: string|null,
 *     radius: string|null,
 *     times: list<string>,
 *     budget: string|null,
 *     level: string|null,
 * }
 */
class QuizController extends Controller
{
    use BuildsPlaceholderData;

    /** Allowed values of each answer. "any" = "Consigliami tu". */
    private const GOALS = ['fitness', 'strength', 'posture', 'sport', 'wellbeing'];

    private const DISCIPLINES = ['Functional', 'Pesi', 'Pilates', 'Yoga', 'Crossfit', 'Boxe', 'Calisthenics', 'any'];

    private const PLACES = ['studio', 'home', 'park', 'online'];

    /** Areas of the zone suggestions, or "online" for "Mi alleno solo online". */
    private const ZONES = ['citta-studi-lambrate', 'navigli-porta-romana', 'isola-bicocca', 'provincia', 'online'];

    private const RADII = ['2', '5', '10'];

    private const TIMES = ['early-morning', 'morning', 'lunch', 'afternoon', 'evening', 'weekend'];

    /** Budget => [min, max] price per session in cents. */
    private const BUDGETS = [
        'up-to-35' => [0, 3500],
        '35-45' => [3500, 4500],
        '45-60' => [4500, 6000],
        'over-60' => [6001, PHP_INT_MAX],
        'any' => [0, PHP_INT_MAX],
    ];

    private const LEVELS = ['beginner', 'occasional', 'regular'];

    private const RESULTS = 3;

    public function show(): Response
    {
        return Inertia::render('public/quiz', [
            'answers' => null,
            'results' => null,
        ]);
    }

    /** Same page, opened on the results: the answers are in the URL, so the link can be shared. */
    public function results(Request $request): Response
    {
        $answers = $this->answers($request);

        return Inertia::render('public/quiz', [
            'answers' => $answers,
            'results' => $this->match($answers),
        ]);
    }

    /**
     * The answers in the URL. Unknown values are dropped: a skipped question stays empty.
     *
     * @return QuizAnswers
     */
    private function answers(Request $request): array
    {
        return [
            'goal' => $this->single($request, 'goal', self::GOALS),
            'disciplines' => $this->multiple($request, 'disciplines', self::DISCIPLINES),
            'places' => $this->multiple($request, 'places', self::PLACES),
            'zone' => $this->single($request, 'zone', self::ZONES),
            'radius' => $this->single($request, 'radius', self::RADII),
            'times' => $this->multiple($request, 'times', self::TIMES),
            'budget' => $this->single($request, 'budget', array_keys(self::BUDGETS)),
            'level' => $this->single($request, 'level', self::LEVELS),
        ];
    }

    /** @param  list<string>  $allowed */
    private function single(Request $request, string $name, array $allowed): ?string
    {
        $value = $request->string($name)->value();

        return in_array($value, $allowed, true) ? $value : null;
    }

    /**
     * Keeps the order chosen by the user, without duplicates.
     *
     * @param  list<string>  $allowed
     * @return list<string>
     */
    private function multiple(Request $request, string $name, array $allowed): array
    {
        $values = $request->query($name);

        if (! is_array($values)) {
            return [];
        }

        return array_values(array_unique(array_filter(
            $values,
            fn (mixed $value) => in_array($value, $allowed, true),
        )));
    }

    /**
     * The trainers that fit the answers best, with up to 3 reasons each.
     * Points as in the design: disciplines 3, goal 2, zone 2, places 1, times 1,
     * budget 1. Out of 10, so points × 10 is the percentage.
     *
     * TODO: use the distance ("radius") and the level once trainers are stored,
     * and match only approved trainers.
     *
     * @param  QuizAnswers  $answers
     * @return list<array<string, mixed>>
     */
    private function match(array $answers): array
    {
        $matches = array_map(
            fn (array $trainer) => $this->score($trainer, $answers),
            $this->placeholderTrainers(),
        );

        // Stable sort: with the same points, the original order wins.
        usort($matches, fn (array $a, array $b): int => $b['points'] <=> $a['points']);

        return array_map(fn (array $match) => [
            'name' => $match['trainer']['name'],
            'href' => route('trainers.show', $match['trainer']['slug'], false),
            'area' => $match['trainer']['area'],
            'rating' => $match['trainer']['rating'],
            'priceFromCents' => $match['trainer']['priceFromCents'],
            'nextSlotLabel' => $match['trainer']['nextSlotLabel'],
            // Never 0% or 100%: it is a suggestion, not a promise.
            'matchPercent' => min(97, max(35, $match['points'] * 10)),
            'reasons' => array_slice($match['reasons'], 0, 3),
        ], array_slice($matches, 0, self::RESULTS));
    }

    /**
     * Points and reasons of one trainer. A reason is a type plus its data:
     * the page turns it into text, e.g. ['type' => 'time', 'time' => 'evening'] → "Libero di sera".
     *
     * @param  PlaceholderTrainer  $trainer
     * @param  QuizAnswers  $answers
     * @return array{trainer: PlaceholderTrainer, points: int, reasons: list<array<string, mixed>>}
     */
    private function score(array $trainer, array $answers): array
    {
        $points = 0;
        $reasons = [];

        $disciplines = in_array('any', $answers['disciplines'], true)
            ? $trainer['disciplines']
            : array_values(array_intersect($answers['disciplines'], $trainer['disciplines']));

        if ($disciplines !== []) {
            $points += 3;
            $reasons[] = ['type' => 'disciplines', 'disciplines' => array_slice($disciplines, 0, 2)];
        }

        if ($answers['goal'] !== null && in_array($answers['goal'], $trainer['goals'], true)) {
            $points += 2;
            $reasons[] = ['type' => 'goal', 'goal' => $answers['goal']];
        }

        $places = array_intersect($answers['places'], $trainer['places']);
        $sameZone = $answers['zone'] !== null && $answers['zone'] === $trainer['zoneGroup'];
        $online = $this->trainsOnline($trainer)
            && ($answers['zone'] === 'online' || in_array('online', $places, true));

        if ($sameZone || $online) {
            $points += 2;
            $reasons[] = ['type' => $sameZone ? 'zone' : 'online'];
        }

        if ($places !== []) {
            $points += 1;
        }

        $times = array_values(array_intersect($answers['times'], $trainer['times']));

        if ($times !== []) {
            $points += 1;
            $reasons[] = ['type' => 'time', 'time' => $times[0]];
        }

        [$min, $max] = self::BUDGETS[$answers['budget'] ?? 'any'];

        if ($trainer['priceFromCents'] >= $min && $trainer['priceFromCents'] <= $max) {
            $points += 1;
            $reasons[] = ['type' => 'budget'];
        }

        return ['trainer' => $trainer, 'points' => $points, 'reasons' => $reasons];
    }
}
