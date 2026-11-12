<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * The fixed accounts to try the staging site with (see docs/staging.md), on
 * top of the demo trainers and gyms. All with the password "password".
 * It can run again.
 */
class StagingSeeder extends Seeder
{
    public function run(): void
    {
        foreach ([
            ['admin@staging.miopersonal.test', 'Admin', UserRole::Admin],
            ['cliente@staging.miopersonal.test', 'Cliente', UserRole::Client],
        ] as [$email, $firstName, $role]) {
            $user = User::firstOrNew(['email' => $email]);
            $user->forceFill([
                'first_name' => $firstName,
                'last_name' => 'Staging',
                'phone' => '+393331234567',
                'password' => 'password',
                'role' => $role,
                'email_verified_at' => now(),
                'terms_accepted_at' => now(),
                // Demo accounts: no "Scegli il tuo username" (EnsureUsernameChosen).
                'username_chosen_at' => $user->username_chosen_at ?? now(),
            ])->save();
        }
    }
}
