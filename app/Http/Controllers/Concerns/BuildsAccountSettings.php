<?php

namespace App\Http\Controllers\Concerns;

use App\Models\User;

/**
 * Data of the "Impostazioni account" sections shared by clients and trainers.
 */
trait BuildsAccountSettings
{
    /**
     * @return array<string, mixed>
     */
    private function accountSettings(User $user): array
    {
        return [
            'firstName' => $user->first_name,
            'lastName' => $user->last_name,
            'phone' => $user->phone,
            'email' => $user->email,
            // False for who signed up with Google: "Imposta una password", without the current one.
            'hasPassword' => $user->password !== null,
            // ISO UTC, for «Cambiata l'ultima volta il…»; null = never changed here.
            'passwordChangedAt' => $user->password_changed_at?->utc()->format('Y-m-d\TH:i:s\Z'),
            // "Continua con Google" saves google_id. TODO: Apple, not available yet.
            'providers' => [
                ['name' => 'Google', 'connected' => $user->google_id !== null],
                ['name' => 'Apple', 'connected' => false],
            ],
        ];
    }
}
