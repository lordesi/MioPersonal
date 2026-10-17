<?php

namespace App\Http\Controllers;

use App\Actions\Fortify\CreateNewUser;
use App\Http\Controllers\Concerns\BuildsAccountSettings;
use App\Http\Requests\Account\PasswordUpdateRequest;
use App\Http\Requests\Account\PersonalDataUpdateRequest;
use App\Models\Booking;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Impostazioni account" of the client. The trainer page (TrainerSettingsController)
 * saves through the same actions below. The email can't be changed here.
 * Deleting the account uses the starter kit route `profile.destroy`, which
 * asks for the password.
 */
class AccountSettingsController extends Controller
{
    use BuildsAccountSettings;

    public function show(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        return Inertia::render('client/settings', [
            'account' => $this->accountSettings($user),
            // "Elimina account": the future bookings are cancelled with the account.
            'pendingBookingTrainers' => $user->bookings()
                ->active()
                ->where('starts_at', '>', now())
                ->with('trainerProfile.user')
                ->get()
                ->map(fn (Booking $booking) => $booking->trainerProfile->user->name)
                ->unique()
                ->values()
                ->all(),
        ]);
    }

    public function updatePersonal(PersonalDataUpdateRequest $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        $user->update([
            'first_name' => trim($request->string('first_name')),
            'last_name' => trim($request->string('last_name')),
            'phone' => CreateNewUser::italianPhone($request->string('phone')->value()),
        ]);

        return back();
    }

    /** Users who signed up with Google set their first password here, without the current one. */
    public function updatePassword(PasswordUpdateRequest $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        $user->update(['password' => $request->string('password')->value()]);
        // Not fillable on purpose: only set here, for «Cambiata l'ultima volta il…».
        $user->forceFill(['password_changed_at' => now()])->save();

        return back();
    }
}
