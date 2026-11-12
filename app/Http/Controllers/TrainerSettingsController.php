<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\BuildsAccountSettings;
use App\Http\Controllers\Concerns\BuildsPlaceholderData;
use App\Models\User;
use App\Support\TrainerSlots;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Impostazioni account" of the trainer: the client sections plus visibility,
 * contacts for the clients and "Chiudi il profilo". Name, email and password
 * are saved by AccountSettingsController, the trainer sections by
 * TrainerProfileSettingsController.
 */
class TrainerSettingsController extends Controller
{
    use BuildsAccountSettings;
    use BuildsPlaceholderData;

    public function __invoke(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $profile = $user->trainerProfile;
        $pausedUntil = $profile?->paused_until?->isFuture() ? $profile->paused_until : null;

        return Inertia::render('trainer/settings', [
            'trainerArea' => $this->trainerArea(),
            'account' => $this->accountSettings($user),
            // Null until the registration is sent: visibility and contacts are hidden.
            'visibility' => $profile === null ? null : [
                'visibleInSearch' => $profile->visible_in_search,
                'acceptsNewClients' => $profile->accepts_new_clients,
                // The first day bookable again, in Rome ("YYYY-MM-DD").
                'pausedUntil' => $pausedUntil?->setTimezone(TrainerSlots::TIMEZONE)->toDateString(),
                // The old "Metti in pausa" without an end: ended by "Riprendi ora".
                'paused' => $profile->paused_at !== null,
            ],
            // Null until the registration is sent, or while the Google client is not set.
            'googleCalendar' => $profile === null || ! TrainerGoogleCalendarController::enabled() ? null : [
                'connected' => $profile->calendarConnection !== null,
                'email' => $profile->calendarConnection?->google_email,
                // Google refused: "Ricollega".
                'error' => $profile->calendarConnection?->last_error,
                // "Blocca gli orari occupati".
                'readsBusy' => $profile->calendarConnection?->readsBusy() ?? false,
                'busySyncedAt' => $profile->calendarConnection?->busy_synced_at?->toIso8601String(),
            ],
            'contacts' => $profile === null ? null : [
                'phone' => $user->phone,
                'email' => $user->email,
                'arrivalNotes' => $profile->arrival_notes ?? '',
                'showPhone' => $profile->show_phone,
                'showEmail' => $profile->show_email,
            ],
        ]);
    }
}
