<?php

namespace App\Support;

use App\Models\City;
use App\Models\TrainerProfile;

/**
 * "Trainer simili" of the public profile: the published trainers closest to
 * this one. Nobody is left out for not being identical: each one gets points
 * from 0 to 1 for the disciplines, the goals and the place, and the most
 * points win. A similar discipline or goal counts less than the same one, a
 * near city more than a far one (Monza before Roma for Milano).
 */
final class SimilarTrainers
{
    private const DISCIPLINES_WEIGHT = 0.4;

    private const GOALS_WEIGHT = 0.2;

    private const PLACE_WEIGHT = 0.4;

    /** At this distance the place is worth half: 1 / (1 + km / 50). */
    private const HALF_POINTS_KM = 50;

    /** Both train online: the place is worth at least this, online works from anywhere. */
    private const ONLINE_PLACE_POINTS = 0.5;

    private const EARTH_RADIUS_KM = 6371;

    /**
     * Disciplines (slugs) that look alike, in both directions: 0.6 close,
     * 0.3 a bit. The same discipline is 1, the pairs missing here 0.
     */
    private const DISCIPLINE_AFFINITY = [
        ['functional', 'crossfit', 0.6],
        ['functional', 'preparazione-atletica', 0.6],
        ['functional', 'calisthenics', 0.6],
        ['pesi-e-bodybuilding', 'calisthenics', 0.6],
        ['pesi-e-bodybuilding', 'crossfit', 0.6],
        ['crossfit', 'calisthenics', 0.6],
        ['crossfit', 'preparazione-atletica', 0.6],
        ['preparazione-atletica', 'running', 0.6],
        ['pilates', 'yoga', 0.6],
        ['pilates', 'postura', 0.6],
        ['yoga', 'postura', 0.6],
        ['functional', 'pesi-e-bodybuilding', 0.3],
        ['functional', 'boxe', 0.3],
        ['functional', 'running', 0.3],
        ['functional', 'pilates', 0.3],
        ['functional', 'postura', 0.3],
        ['pesi-e-bodybuilding', 'preparazione-atletica', 0.3],
        ['crossfit', 'boxe', 0.3],
        ['crossfit', 'running', 0.3],
        ['preparazione-atletica', 'boxe', 0.3],
    ];

    /** Same idea for the goals (App\Enums\TrainingGoal values). */
    private const GOAL_AFFINITY = [
        ['weight_loss', 'endurance', 0.6],
        ['muscle', 'athletic', 0.6],
        ['athletic', 'endurance', 0.6],
        ['posture', 'wellbeing', 0.6],
        ['weight_loss', 'athletic', 0.3],
        ['weight_loss', 'muscle', 0.3],
    ];

    /**
     * The ids of the most similar trainers, the closest first. Only those with
     * something in common (a discipline or a goal, even just similar); with
     * the same points, the most reviewed. An online-only trainer only gets
     * trainers who train online: their clients can be anywhere.
     *
     * Counted in PHP, on every published trainer: fine for the beta's few
     * hundred, to cache when they become thousands.
     *
     * @return list<int>
     */
    public static function ids(TrainerProfile $profile, int $limit): array
    {
        $candidates = TrainerProfile::query()
            ->published()
            ->whereKeyNot($profile->id)
            ->when($profile->city_id === null, fn ($query) => $query->where('trains_online', true))
            ->with(['city', 'otherCities', 'disciplines'])
            ->get();

        $disciplines = $profile->disciplines->pluck('slug')->all();
        $scored = [];

        foreach ($candidates as $candidate) {
            $common = self::DISCIPLINES_WEIGHT * self::affinity($disciplines, $candidate->disciplines->pluck('slug')->all(), self::DISCIPLINE_AFFINITY)
                + self::GOALS_WEIGHT * self::affinity($profile->goals ?? [], $candidate->goals ?? [], self::GOAL_AFFINITY);

            if ($common <= 0) {
                continue;
            }

            $scored[] = [
                'id' => $candidate->id,
                'points' => $common + self::PLACE_WEIGHT * self::placePoints($profile, $candidate),
                'reviews' => $candidate->rating_count,
            ];
        }

        usort($scored, fn (array $a, array $b) => [$b['points'], $b['reviews'], $a['id']] <=> [$a['points'], $a['reviews'], $b['id']]);

        return array_slice(array_column($scored, 'id'), 0, $limit);
    }

    /**
     * From 0 to 1: for each of mine, the most similar of theirs, on average.
     *
     * @param  array<string>  $mine
     * @param  array<string>  $theirs
     * @param  list<array{string, string, float}>  $pairs
     */
    private static function affinity(array $mine, array $theirs, array $pairs): float
    {
        if ($mine === [] || $theirs === []) {
            return 0.0;
        }

        $total = 0.0;

        foreach ($mine as $one) {
            $best = 0.0;

            foreach ($theirs as $other) {
                $best = max($best, self::pairAffinity($one, $other, $pairs));
            }

            $total += $best;
        }

        return $total / count($mine);
    }

    /**
     * @param  list<array{string, string, float}>  $pairs
     */
    private static function pairAffinity(string $one, string $other, array $pairs): float
    {
        if ($one === $other) {
            return 1.0;
        }

        foreach ($pairs as [$a, $b, $value]) {
            if (($a === $one && $b === $other) || ($a === $other && $b === $one)) {
                return $value;
            }
        }

        return 0.0;
    }

    /**
     * From 0 to 1: 1 in the same city, less the farther the closest two of
     * their cities (main and other ones); at least 0.5 when both train online.
     */
    private static function placePoints(TrainerProfile $profile, TrainerProfile $candidate): float
    {
        // Online only: every candidate trains online too (see ids()).
        if ($profile->city_id === null) {
            return 1.0;
        }

        $online = $profile->trains_online && $candidate->trains_online ? self::ONLINE_PLACE_POINTS : 0.0;
        $km = null;

        foreach (self::cities($profile) as $mine) {
            foreach (self::cities($candidate) as $theirs) {
                $km = min($km ?? INF, self::distanceKm($mine, $theirs));
            }
        }

        return max($online, $km === null ? 0.0 : 1 / (1 + $km / self::HALF_POINTS_KM));
    }

    /**
     * The main city and the other ones; none for an online-only trainer.
     *
     * @return list<City>
     */
    private static function cities(TrainerProfile $profile): array
    {
        return array_values(array_filter([$profile->city, ...$profile->otherCities->all()]));
    }

    /** Straight-line distance in km (haversine formula), like distanceKm() in geo.ts. */
    private static function distanceKm(City $a, City $b): float
    {
        $latDelta = deg2rad($b->lat - $a->lat);
        $lngDelta = deg2rad($b->lng - $a->lng);
        $h = sin($latDelta / 2) ** 2 + cos(deg2rad($a->lat)) * cos(deg2rad($b->lat)) * sin($lngDelta / 2) ** 2;

        return 2 * self::EARTH_RADIUS_KM * asin(min(1, sqrt($h)));
    }
}
