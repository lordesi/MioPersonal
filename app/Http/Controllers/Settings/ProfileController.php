<?php

namespace App\Http\Controllers\Settings;

use App\Actions\Trainer\DeleteTrainerProfile;
use App\Enums\BookingActor;
use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileDeleteRequest;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use App\Models\Booking;
use App\Models\User;
use App\Support\TrainerSlots;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Profile updated.')]);

        return to_route('profile.edit');
    }

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
