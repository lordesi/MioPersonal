<?php

namespace App\Support;

use App\Enums\Achievement;
use App\Http\Controllers\TrainerShareController;
use App\Models\ClientAchievement;
use App\Models\TrainerProfile;
use App\Models\User;

/**
 * "Traguardi": saves the ones the client has just reached and says how far
 * the next one is. Called when "Panoramica" opens and after "Segna un
 * allenamento": no scheduler. Safe to call again: each one is saved once.
 */
final class Achievements
{
    /**
     * Saves the new ones and returns them.
     *
     * @return list<Achievement>
     */
    public static function sync(User $client, ClientProgress $progress): array
    {
        $have = $client->achievements()->pluck('key')
            ->map(fn (Achievement|string $key) => $key instanceof Achievement ? $key : Achievement::from($key))
            ->all();
        $new = array_values(array_filter(
            Achievement::cases(),
            fn (Achievement $achievement) => ! in_array($achievement, $have, true) && self::reached($achievement, $progress),
        ));

        if ($new === []) {
            return [];
        }

        $firstSessionTrainer = $progress->entries->where('source', 'session')->last()['trainerProfileId'] ?? null;
        $mainTrainer = $progress->mainTrainerId();
        $now = now();

        ClientAchievement::query()->insertOrIgnore(array_map(fn (Achievement $achievement) => [
            'user_id' => $client->id,
            'key' => $achievement->value,
            'earned_at' => $now,
            // The first session: who it was with. The others: the client's trainer, if any.
            'trainer_profile_id' => match ($achievement) {
                Achievement::FirstSession => $firstSessionTrainer,
                Achievement::FirstLog, Achievement::FirstEvent, Achievement::Disciplines3 => null,
                default => $mainTrainer,
            },
            'created_at' => $now,
            'updated_at' => $now,
        ], $new));

        return $new;
    }

    /**
     * ClientAchievements, for the frontend: the ones reached (the most recent
     * first) and the closest one still to reach.
     *
     * @return array<string, mixed>
     */
    public static function summary(User $client, ClientProgress $progress): array
    {
        $earned = $client->achievements()
            ->with('trainerProfile.user')
            ->latest('earned_at')
            ->latest('id')
            ->get();
        $have = $earned->map(fn (ClientAchievement $achievement) => $achievement->key)->all();
        $published = TrainerProfile::query()->published()
            ->whereIn('id', $earned->pluck('trainer_profile_id')->filter()->unique()->all())
            ->pluck('id')->all();

        $next = collect(Achievement::cases())
            ->reject(fn (Achievement $achievement) => in_array($achievement, $have, true) || $achievement->goal() === null)
            ->map(fn (Achievement $achievement) => [
                'achievement' => $achievement,
                'current' => self::measure($achievement, $progress),
                'target' => $achievement->goal()['target'] ?? 1,
            ])
            ->sortByDesc(fn (array $item) => $item['current'] / $item['target'])
            ->first();

        return [
            'earned' => $earned->map(fn (ClientAchievement $achievement) => [
                'key' => $achievement->key->value,
                'title' => $achievement->key->title(),
                'description' => $achievement->key->description(),
                'earnedAt' => ClientBookingData::iso($achievement->earned_at),
                // Named on the image only while the profile is published.
                'trainer' => $achievement->trainerProfile === null || ! in_array($achievement->trainer_profile_id, $published, true) ? null : [
                    'name' => $achievement->trainerProfile->user->name,
                    'link' => TrainerShareController::link($achievement->trainerProfile, 'traguardo'),
                ],
            ])->values()->all(),
            'next' => $next === null ? null : [
                'key' => $next['achievement']->value,
                'title' => $next['achievement']->title(),
                'description' => $next['achievement']->description(),
                'current' => min($next['current'], $next['target']),
                'target' => $next['target'],
            ],
            // Where the image for the stories leads without a trainer.
            'siteLink' => route('home', ['utm_source' => 'instagram', 'utm_medium' => 'traguardo']),
        ];
    }

    private static function reached(Achievement $achievement, ClientProgress $progress): bool
    {
        return match ($achievement) {
            Achievement::FirstSession => $progress->entries->contains('source', 'session'),
            Achievement::FirstLog => $progress->entries->contains('source', 'log'),
            Achievement::FirstEvent => $progress->entries->contains('source', 'event'),
            default => self::measure($achievement, $progress) >= ($achievement->goal()['target'] ?? PHP_INT_MAX),
        };
    }

    private static function measure(Achievement $achievement, ClientProgress $progress): int
    {
        return match ($achievement->goal()['measure'] ?? null) {
            'streak' => $progress->longestStreak(),
            'total' => $progress->total(),
            'disciplines' => $progress->disciplines(),
            default => 0,
        };
    }
}
