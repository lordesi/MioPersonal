<?php

use App\Actions\Account\DeleteUser;
use App\Enums\TrainerProfileStatus;
use App\Enums\UserRole;
use App\Models\Booking;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Support\TrainerSlots;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

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

// Time passes and "oggi alle 9" expires: the first free slot of the search is
// computed again every hour. In production the scheduler needs a cron entry
// that runs `php artisan schedule:run` every minute.
Artisan::command('trainers:refresh-slots', function () {
    $count = 0;

    TrainerProfile::where('status', TrainerProfileStatus::Approved)
        ->with('workingHours')
        ->chunkById(100, function ($profiles) use (&$count) {
            foreach ($profiles as $profile) {
                TrainerSlots::refresh($profile);
                $count++;
            }
        });

    $this->info("First free slot updated for {$count} trainers.");
})->purpose('Recompute the first free slot of the approved trainers');

Schedule::command('trainers:refresh-slots')->hourly();

// A request the trainer didn't answer in time becomes "expired" (the slot is
// already free: TrainerSlots ignores pending bookings past `expires_at`).
Artisan::command('bookings:expire', function () {
    $count = 0;

    Booking::query()
        ->overdue()
        ->with('trainerProfile.workingHours')
        ->chunkById(100, function ($bookings) use (&$count) {
            foreach ($bookings as $booking) {
                $booking->expire();
                TrainerSlots::refresh($booking->trainerProfile);
                $count++;
            }
        });

    // "Sposta" proposals the client didn't answer: the old time holds (the new
    // one is already free: TrainerSlots ignores proposals past their expiry).
    $proposals = Booking::query()
        ->whereNotNull('proposed_starts_at')
        ->where('proposal_expires_at', '<=', now())
        ->update(['proposed_starts_at' => null, 'proposal_expires_at' => null]);

    $this->info("{$count} booking requests expired, {$proposals} proposals lapsed.");
})->purpose('Mark the booking requests the trainer did not answer in time as expired');

Schedule::command('bookings:expire')->everyMinute();

// "Elimina account" and "Cancella dati" of the team: the account is deleted for
// good User::DELETION_GRACE_DAYS later (until then it can be taken back).
Artisan::command('users:purge-deleted', function (DeleteUser $deleteUser) {
    $count = 0;

    User::where('deletion_scheduled_at', '<=', now()->subDays(User::DELETION_GRACE_DAYS))
        ->each(function (User $user) use ($deleteUser, &$count) {
            $deleteUser->handle($user);
            $count++;
        });

    $this->info("{$count} accounts deleted.");
})->purpose('Delete the accounts whose deletion was asked more than 30 days ago');

Schedule::command('users:purge-deleted')->daily();
