<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\BuildsAccountSettings;
use App\Http\Controllers\Concerns\BuildsPlaceholderData;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Impostazioni account" of the trainer: the client sections plus visibility,
 * contacts for the clients and "Chiudi il profilo". It saves name, email and
 * password through AccountSettingsController.
 */
class TrainerSettingsController extends Controller
{
    use BuildsAccountSettings;
    use BuildsPlaceholderData;

    public function __invoke(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        // TODO: load visibility, contacts and upcoming sessions from the database.
        return Inertia::render('trainer/settings', [
            'trainerArea' => $this->trainerArea(),
            'account' => $this->accountSettings($user),
            // TODO: add the phone (and WhatsApp) once users have a phone column.
            'contacts' => [
                'email' => $user->email,
                'arrivalNotes' => 'Citofono «Studio 3B», secondo piano.',
            ],
            'upcoming' => ['sessions' => 3, 'requests' => 3],
        ]);
    }
}
