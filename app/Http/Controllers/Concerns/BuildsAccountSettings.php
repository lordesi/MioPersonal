<?php

namespace App\Http\Controllers\Concerns;

use App\Enums\PushCategory;
use App\Models\User;
use App\Providers\FortifyServiceProvider;

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
            // "Continua con Google" and "Collega" save google_id. Not available
            // without the keys in the .env: "Collega" is hidden.
            // "Notifiche": the push devices are read by the browser (lib/push.ts).
            'notifications' => [
                'reminders' => $user->wantsReminders(),
                // "Cosa ricevere sul dispositivo": only the kinds this role receives.
                'push' => array_map(fn (PushCategory $category) => [
                    'key' => $category->value,
                    'label' => $category->label(),
                    'description' => $category->description($user->role),
                    'enabled' => $user->wantsPush($category),
                ], PushCategory::forRole($user->role)),
            ],
            'providers' => [
                [
                    'name' => 'Google',
                    'connected' => $user->google_id !== null,
                    'available' => FortifyServiceProvider::googleEnabled(),
                ],
            ],
        ];
    }
}
