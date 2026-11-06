<?php

namespace App\Http\Controllers\Settings;

use App\Actions\Account\ScheduleUserDeletion;
use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileDeleteRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;

/**
 * "Elimina account" of "Impostazioni account", for clients and trainers.
 */
class ProfileController extends Controller
{
    /**
     * Blocks the account now (future bookings cancelled, trainer profile out of
     * the search) and deletes it after User::DELETION_GRACE_DAYS: logging in
     * before then takes it back (AccountDeletionController).
     */
    public function destroy(ProfileDeleteRequest $request, ScheduleUserDeletion $scheduleDeletion): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        $scheduleDeletion->handle($user, User::DELETION_BY_USER);

        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
