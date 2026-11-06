<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Account in eliminazione": who asked to delete their account and logs in
 * again within User::DELETION_GRACE_DAYS can take it back.
 */
class AccountDeletionController extends Controller
{
    public function show(Request $request): Response|RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (! $user->hasPendingSelfDeletion()) {
            return redirect('/');
        }

        return Inertia::render('auth/account-deletion', [
            // Rome date, Y-m-d.
            'deletionDate' => $user->deletionDate()?->setTimezone('Europe/Rome')->toDateString(),
        ]);
    }

    /** "Annulla eliminazione": the bookings cancelled meanwhile don't come back. */
    public function cancel(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->hasPendingSelfDeletion()) {
            $user->forceFill(['deletion_scheduled_at' => null, 'deletion_requested_by' => null])->save();
            Inertia::flash('toast', ['type' => 'success', 'message' => 'Bentornato! Il tuo account non verrà eliminato.']);
        }

        return redirect('/');
    }
}
