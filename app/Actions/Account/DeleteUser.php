<?php

namespace App\Actions\Account;

use App\Actions\Gym\DeleteGymProfile;
use App\Actions\Trainer\DeleteTrainerProfile;
use App\Enums\BookingActor;
use App\Models\Booking;
use App\Models\Conversation;
use App\Models\TrainerClient;
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
    public function __construct(
        private DeleteTrainerProfile $deleteProfile,
        private DeleteGymProfile $deleteGym,
    ) {}

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

        // A gym's profile too, with its photos.
        if ($user->gymProfile !== null) {
            $this->deleteGym->handle($user->gymProfile);
        }

        // "Messaggi" with the client's trainers, with their PDFs (the trainers keep the record).
        Conversation::purge(Conversation::query()
            ->whereIn('trainer_client_id', TrainerClient::query()->where('user_id', $user->id)->select('id'))
            ->get());

        // The bell of the site (the notifications are not tied to the user by a foreign key).
        $user->notifications()->delete();

        $user->delete();

        // The photo of "Completa il tuo profilo" goes with the account.
        if ($user->avatar_path !== null) {
            Storage::disk(User::AVATAR_DISK)->delete($user->avatar_path);
        }
    }
}
