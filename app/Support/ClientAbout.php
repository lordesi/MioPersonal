<?php

namespace App\Support;

use App\Models\ClientPreference;
use App\Models\User;

/**
 * "Sul cliente": what a client wrote in "Su di te" of "Completa il tuo
 * profilo", for the trainers the client booked ("Richieste" and "Clienti").
 * The callers only pass clients with a booking with that trainer.
 *
 * Height and weight are there only while the client's consent is on
 * (ClientPreference::$body_data_consent_at); the update deletes them otherwise.
 */
final class ClientAbout
{
    /**
     * Null when the client wrote nothing (or deleted the account).
     *
     * @return array{age: int|null, sex: string|null, goal: string|null, level: string|null, experience: string|null, activity: string|null, sessionsPerWeek: int|null, sports: list<string>, note: string|null, heightCm: int|null, weightKg: int|null}|null
     */
    public static function from(?User $client): ?array
    {
        $preference = $client?->clientPreference;

        if (! $preference instanceof ClientPreference) {
            return null;
        }

        $bodyData = $preference->body_data_consent_at !== null;

        $about = [
            // Only the year is saved: the age the client turns this year.
            'age' => $preference->birth_year === null ? null : (int) now()->year - $preference->birth_year,
            'sex' => $preference->sex?->label(),
            // A value of App\Enums\TrainingGoal: the page has the labels (goals.ts).
            'goal' => $preference->goal?->value,
            'level' => $preference->fitness_level?->label(),
            'experience' => $preference->training_experience?->label(),
            'activity' => $preference->activity_level?->label(),
            'sessionsPerWeek' => $preference->sessions_per_week,
            'sports' => $preference->sports ?? [],
            'note' => $preference->trainer_note,
            'heightCm' => $bodyData ? $preference->height_cm : null,
            'weightKg' => $bodyData ? $preference->weight_kg : null,
        ];

        $filled = array_filter($about, fn (mixed $value) => $value !== null && $value !== []);

        return $filled === [] ? null : $about;
    }
}
