<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\BuildsAccountSettings;
use App\Http\Requests\Account\EmailUpdateRequest;
use App\Http\Requests\Account\PasswordUpdateRequest;
use App\Http\Requests\Account\PersonalDataUpdateRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Impostazioni account" of the client. The trainer page (TrainerSettingsController)
 * saves through the same actions below. Deleting the account uses the
 * starter kit route `profile.destroy`, which asks for the password.
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
            // TODO: load the client's pending bookings (they are cancelled with the account).
            'pendingBookingTrainers' => ['Giulia Rossi'],
        ]);
    }

    public function updatePersonal(PersonalDataUpdateRequest $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        $user->update([
            'name' => trim($request->string('first_name')).' '.trim($request->string('last_name')),
        ]);

        return back();
    }

    /** A new address has to be verified again: Laravel sends the link. */
    public function updateEmail(EmailUpdateRequest $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        $user->fill(['email' => $request->string('email')->value()]);

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
            $user->save();
            $user->sendEmailVerificationNotification();
        }

        return back();
    }

    public function updatePassword(PasswordUpdateRequest $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        $user->update(['password' => $request->string('password')->value()]);

        return back();
    }
}
