<?php

namespace App\Http\Controllers\Settings;

use App\Actions\Trainer\DeleteTrainerProfile;
use App\Enums\BookingActor;
use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileDeleteRequest;
use App\Models\Booking;
use App\Models\User;
use App\Support\TrainerSlots;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

/**
 * "Elimina account" of "Impostazioni account", for clients and trainers.
 */
class ProfileController extends Controller
{
    /**
     * Delete the user's profile.
     */
    public function destroy(ProfileDeleteRequest $request, DeleteTrainerProfile $deleteProfile): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        // Future bookings are cancelled, so the trainers get their slots back;
        // the past ones stay for the trainer, without the client (client_id empty).
        $user->bookings()->active()->where('starts_at', '>', now())->with('trainerProfile.workingHours')->get()
            ->each(function (Booking $booking) use ($user) {
                $booking->cancel(BookingActor::Client, $user);
                TrainerSlots::refresh($booking->trainerProfile);
            });

        // A trainer's profile goes too, with its photos and certificates on the disk.
        if ($user->trainerProfile !== null) {
            $deleteProfile->handle($user->trainerProfile);
        }

        Auth::logout();

        $user->delete();

        // The photo of "Completa il tuo profilo" goes with the account.
        if ($user->avatar_path !== null) {
            Storage::disk(User::AVATAR_DISK)->delete($user->avatar_path);
        }

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
