<?php

namespace App\Http\Controllers\Concerns;

use App\Models\User;

/**
 * Data of the "Impostazioni account" sections shared by clients and trainers.
 */
trait BuildsAccountSettings
{
    /**
     * The sign-up joins name and surname into `users.name`: split it back at
     * the first space, so "Lorenzo De Simone" becomes "Lorenzo" + "De Simone".
     * TODO: save first and last name in two columns (needs a migration: ask first).
     *
     * @return array<string, mixed>
     */
    private function accountSettings(User $user): array
    {
        [$firstName, $lastName] = array_pad(explode(' ', trim($user->name), 2), 2, '');

        return [
            'firstName' => $firstName,
            'lastName' => $lastName,
            'email' => $user->email,
            // TODO: real data once sign-in with Google/Apple exists (Socialite: ask first).
            'providers' => [
                ['name' => 'Google', 'connected' => true],
                ['name' => 'Apple', 'connected' => false],
            ],
            // TODO: read the user's sessions (SESSION_DRIVER=database) instead of the design examples.
            'devices' => [
                ['id' => 1, 'name' => 'iPhone · Safari', 'detail' => 'Milano · attivo ora', 'current' => true],
                ['id' => 2, 'name' => 'MacBook · Chrome', 'detail' => 'Milano · 2 giorni fa', 'current' => false],
            ],
        ];
    }
}
