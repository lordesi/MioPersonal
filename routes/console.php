<?php

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// The only way to become an admin: run it on the server for an existing account.
Artisan::command('admin:grant {email}', function (string $email) {
    $user = User::where('email', $email)->first();

    if ($user === null) {
        $this->error("No user with email {$email}: sign up first, then run this again.");

        return 1;
    }

    $user->role = UserRole::Admin;
    $user->save();

    $this->info("{$user->name} can now open /admin.");

    return 0;
})->purpose('Give an existing user access to the admin panel');
