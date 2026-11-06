<?php

namespace App\Actions\Account;

use App\Enums\BookingActor;
use App\Models\Booking;
use App\Models\User;
use App\Support\TrainerSlots;
use Illuminate\Support\Facades\DB;

/**
 * "Elimina account" (by: 'user') and "Cancella dati" of the admin (by: 'admin'):
 * the account is blocked now and deleted after User::DELETION_GRACE_DAYS
 * (DeleteUser). The future bookings are cancelled right away, so nobody waits
 * for a session that won't happen; they don't come back if the deletion is
 * taken back.
 */
class ScheduleUserDeletion
{
    public function handle(User $user, string $by): void
    {
        DB::transaction(function () use ($user, $by) {
            $user->forceFill([
                'deletion_scheduled_at' => now(),
                'deletion_requested_by' => $by,
            ])->save();

            $self = $by === User::DELETION_BY_USER;
            // In the booking history: the user did it, or the team (no actor).
            $actor = $self ? $user : null;

            // As a client.
            $user->bookings()->active()->where('starts_at', '>', now())->with('trainerProfile.workingHours')->get()
                ->each(function (Booking $booking) use ($self, $actor) {
                    $booking->cancel($self ? BookingActor::Client : BookingActor::System, $actor);
                    TrainerSlots::refresh($booking->trainerProfile);
                });

            // As a trainer: the clients get their sessions cancelled.
            $profile = $user->trainerProfile;

            if ($profile !== null) {
                $profile->bookings()->active()->where('starts_at', '>', now())->get()
                    ->each(fn (Booking $booking) => $booking->cancel($self ? BookingActor::Trainer : BookingActor::System, $actor));
                TrainerSlots::refresh($profile->load('workingHours'));
            }
        });
    }
}
