<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Account\ScheduleUserDeletion;
use App\Actions\Trainer\DeleteTrainerProfile;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\AdminActivity;
use App\Models\User;
use App\Support\TrainerSlots;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

/**
 * "Sospendi" / "Riattiva", "Cancella dati" / "Annulla" and a trainer's
 * "Elimina profilo" of Admin · Utenti.
 * The user is logged out at the next page (EnsureAccountActive). Never on
 * the team's own accounts.
 */
class AdminUserStatusController extends Controller
{
    public function suspend(User $user): RedirectResponse
    {
        $this->ensureNotAdmin($user);

        $user->forceFill(['suspended_at' => now()])->save();
        $this->refreshSlots($user);

        return $this->done('user.suspended', $user, "Account sospeso: {$user->name}");
    }

    public function reactivate(User $user): RedirectResponse
    {
        $user->forceFill(['suspended_at' => null])->save();
        $this->refreshSlots($user);

        return $this->done('user.reactivated', $user, "Account riattivato: {$user->name}");
    }

    /** Deleted after User::DELETION_GRACE_DAYS (`users:purge-deleted`). */
    public function scheduleDeletion(User $user, ScheduleUserDeletion $scheduleDeletion): RedirectResponse
    {
        $this->ensureNotAdmin($user);

        $scheduleDeletion->handle($user, User::DELETION_BY_ADMIN);

        return $this->done('user.deletion_scheduled', $user, "Dati di {$user->name} in cancellazione: spariscono tra ".User::DELETION_GRACE_DAYS.' giorni.');
    }

    /** Also a deletion the user asked for: they asked the team to keep the account. */
    public function cancelDeletion(User $user): RedirectResponse
    {
        $user->forceFill(['deletion_scheduled_at' => null, 'deletion_requested_by' => null])->save();
        $this->refreshSlots($user);

        return $this->done('user.deletion_cancelled', $user, "Cancellazione annullata: {$user->name}");
    }

    /**
     * "Elimina profilo" of a trainer, as their "Chiudi il profilo": profile,
     * services, hours, photos, certificates, bookings and reviews go now;
     * the account stays and becomes a client one again.
     */
    public function deleteTrainerProfile(User $user, DeleteTrainerProfile $deleteProfile): RedirectResponse
    {
        $this->ensureNotAdmin($user);

        $profile = $user->trainerProfile;
        abort_if($profile === null, 404);

        DB::transaction(function () use ($user, $profile, $deleteProfile) {
            $deleteProfile->handle($profile);

            $user->role = UserRole::Client;
            $user->save();
        });

        return $this->done('trainer.deleted', $user, "Profilo trainer di {$user->name} eliminato: resta iscritto come cliente.");
    }

    private function ensureNotAdmin(User $user): void
    {
        abort_if($user->role === UserRole::Admin, 403);
    }

    /** The first free slot of the search cards. */
    private function refreshSlots(User $user): void
    {
        if ($user->trainerProfile !== null) {
            TrainerSlots::refresh($user->trainerProfile->load('workingHours'));
        }
    }

    /** The toast for the team, and the same words in the "Registro attività". */
    private function done(string $action, User $user, string $message): RedirectResponse
    {
        AdminActivity::log($action, $user, $message);

        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return back();
    }
}
