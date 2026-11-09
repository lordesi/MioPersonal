<?php

use App\Actions\Account\DeleteUser;
use App\Actions\Bookings\GenerateSeries;
use App\Actions\Bookings\SendSessionReminders;
use App\Actions\GroupSessions\SendGroupSessionReminders;
use App\Actions\Trainer\DeleteTrainerProfile;
use App\Actions\Waitlist\Waitlist;
use App\Enums\TrainerProfileStatus;
use App\Enums\UserRole;
use App\Jobs\SyncCalendarJob;
use App\Models\Booking;
use App\Models\BookingSeries;
use App\Models\TrainerCalendarConnection;
use App\Models\TrainerPhoto;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Support\SafeImage;
use App\Support\Staging;
use App\Support\Stats;
use App\Support\TrainerSlots;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schedule;
use Illuminate\Support\Facades\Storage;

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

    // /admin asks for the password again (password.confirm): an account made with
    // Google has none and would be locked out.
    if ($user->password === null) {
        $this->error("{$email} has no password (signed up with Google): set one in Impostazioni account, then run this again.");

        return 1;
    }

    $user->role = UserRole::Admin;
    $user->save();

    $this->info("{$user->name} can now open /admin.");

    return 0;
})->purpose('Give an existing user access to the admin panel');

// admin:grant changes only the role: a trainer who becomes admin keeps the
// profile, still in the search. This deletes it; the account and its role stay.
Artisan::command('trainer:delete-profile {email}', function (string $email, DeleteTrainerProfile $deleteProfile) {
    $user = User::where('email', $email)->first();

    if ($user?->trainerProfile === null) {
        $this->error("No trainer profile for {$email}.");

        return 1;
    }

    if (! $this->confirm("Delete the trainer profile of {$user->name} with its services, hours, photos, bookings and reviews? It can't be undone.")) {
        return 1;
    }

    $deleteProfile->handle($user->trainerProfile);

    $this->info("Trainer profile of {$user->name} deleted; the account stays ({$user->role->value}).");

    return 0;
})->purpose('Delete the trainer profile of an account, keeping the account');

// The history collected by App\Support\Stats starts again from zero. The numbers
// read from users and bookings stay: delete the test accounts for those.
Artisan::command('stats:reset', function () {
    if (! $this->confirm('Delete all the visits, page views, searches, profile views and activity days collected so far?')) {
        return 1;
    }

    foreach (Stats::HISTORY_TABLES as $table) {
        DB::table($table)->delete();
    }

    $this->info('Statistics reset: they start again from today.');

    return 0;
})->purpose('Delete the history of the statistics to start counting again');

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

// The reminders the day before and 2 hours before a confirmed session, and an event.
Artisan::command('bookings:remind', function (SendSessionReminders $reminders, SendGroupSessionReminders $eventReminders) {
    $this->info("{$reminders->handle()} reminders sent.");
    $this->info("{$eventReminders->handle()} event reminders sent.");
})->purpose('Remind clients and trainers of their next confirmed sessions and events');

Schedule::command('bookings:remind')->everyFiveMinutes()->withoutOverlapping();

// "Avvisami se si libera": the first ones in line for a free place or slot are told. Most
// of the time it happens at once (a place given back, a booking cancelled); this catches the rest.
Artisan::command('waitlist:notify', function (Waitlist $waitlist) {
    $waitlist->sweep();
    $this->info('Waiting lists checked.');
})->purpose('Tell the people waiting for a place or a slot that it is free');

Schedule::command('waitlist:notify')->everyFiveMinutes()->withoutOverlapping();

// "Sedute fisse": the sessions of every rule are made some weeks ahead, and a date
// that was taken (or closed) is tried again. A cancelled session is never made again.
Artisan::command('bookings:extend-series', function (GenerateSeries $generate) {
    $created = 0;
    $skipped = 0;

    BookingSeries::query()->active()->with(['trainerProfile.user', 'client'])->each(function (BookingSeries $series) use ($generate, &$created, &$skipped) {
        $result = $generate->handle($series);
        $created += $result['created'];
        $skipped += count($result['skipped']);
    });

    $this->info("{$created} sessions made, {$skipped} dates still taken or closed.");
})->purpose('Make the next weeks of the sessions of the "sedute fisse"');

Schedule::command('bookings:extend-series')->dailyAt('03:30')->withoutOverlapping();

// Staging only: the database starts again from the seeders (demo trainers and gyms,
// the accounts of docs/staging.md). Refuses to run anywhere else.
Artisan::command('staging:reset', function () {
    if (! Staging::active()) {
        $this->error('Only on the staging site (APP_ENV=staging): nothing was touched.');

        return 1;
    }

    $this->call('migrate:fresh', ['--seed' => true, '--force' => true]);

    return 0;
})->purpose('Staging only: empty the database and fill it again with the fake data');

// Safety net of "Collega Google Calendar": what the live sync may have missed
// (Google down for longer than the retries, an event deleted by hand) is put right.
Artisan::command('calendar:resync', function () {
    $count = 0;

    TrainerCalendarConnection::query()->whereNull('last_error')->each(function (TrainerCalendarConnection $connection) use (&$count) {
        SyncCalendarJob::dispatch('connection', $connection->id);
        $count++;
    });

    $this->info("{$count} Google calendars queued to be checked.");
})->purpose('Check again the sessions written on the Google calendars of the trainers');

Schedule::command('calendar:resync')->dailyAt('04:30');

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

// Once, for the photos uploaded before SafeImage: each one is drawn again in
// place, without metadata (GPS position…), upright and at most 2000 px.
Artisan::command('photos:strip-metadata', function () {
    $clean = function (string $disk, string $path): bool {
        $storage = Storage::disk($disk);

        if (! $storage->exists($path)) {
            $this->warn("Missing: {$path}");

            return false;
        }

        try {
            [$contents] = SafeImage::clean((string) $storage->get($path));
        } catch (Throwable $exception) {
            $this->warn("Skipped {$path}: {$exception->getMessage()}");

            return false;
        }

        return $storage->put($path, $contents) !== false;
    };

    $done = 0;

    TrainerPhoto::query()->select(['id', 'path'])->chunkById(100, function ($photos) use ($clean, &$done) {
        foreach ($photos as $photo) {
            $done += (int) $clean(TrainerPhoto::DISK, $photo->path);
        }
    });

    User::query()->whereNotNull('avatar_path')->select(['id', 'avatar_path'])->chunkById(100, function ($users) use ($clean, &$done) {
        foreach ($users as $user) {
            $done += (int) $clean(User::AVATAR_DISK, $user->avatar_path);
        }
    });

    $this->info("{$done} photos cleaned.");

    return 0;
})->purpose('Remove metadata (GPS…) from the photos uploaded so far');
