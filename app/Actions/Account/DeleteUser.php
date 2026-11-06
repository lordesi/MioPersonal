<?php

namespace App\Actions\Account;

use App\Actions\Trainer\DeleteTrainerProfile;
use App\Enums\BookingActor;
use App\Models\Booking;
use App\Models\User;
use App\Support\TrainerSlots;
use Illuminate\Support\Facades\Storage;

/**
 * Deletes an account for good, 30 days after "Elimina account" or the
 * team's "Cancella dati" (`users:purge-deleted`). Past bookings and reviews
 * stay, without the client (client_id empty: "Utente anonimo").
 */
class DeleteUser
{
    public function __construct(private DeleteTrainerProfile $deleteProfile) {}

    public function handle(User $user): void
    {
        // Already cancelled when the deletion was asked; these are only the
        // ones that could have slipped in between.
        $user->bookings()->active()->where('starts_at', '>', now())->with('trainerProfile.workingHours')->get()
            ->each(function (Booking $booking) {
                $booking->cancel(BookingActor::System);
                TrainerSlots::refresh($booking->trainerProfile);
            });

        // A trainer's profile goes too, with its photos and certificates on the disk.
        if ($user->trainerProfile !== null) {
            $this->deleteProfile->handle($user->trainerProfile);
        }

        $user->delete();

        // The photo of "Completa il tuo profilo" goes with the account.
        if ($user->avatar_path !== null) {
            Storage::disk(User::AVATAR_DISK)->delete($user->avatar_path);
        }
    }
}
