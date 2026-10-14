<?php

use App\Enums\BookingStatus;
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
        ->where('status', BookingStatus::Pending)
        ->where('expires_at', '<=', now())
        ->with('trainerProfile.workingHours')
        ->chunkById(100, function ($bookings) use (&$count) {
            foreach ($bookings as $booking) {
                $booking->forceFill(['status' => BookingStatus::Expired])->save();
                $booking->record('expired');
                TrainerSlots::refresh($booking->trainerProfile);
                $count++;
            }
        });

    $this->info("{$count} booking requests expired.");
})->purpose('Mark the booking requests the trainer did not answer in time as expired');

Schedule::command('bookings:expire')->everyMinute();
