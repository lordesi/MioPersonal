<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\TrainerDocument;
use App\Models\TrainerPhoto;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Support\TrainerSlots;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

/**
 * The trainer sections of "Impostazioni account": "Visibilità del profilo",
 * "Contatti per i clienti" and "Chiudi il profilo" (with "Metti in pausa").
 */
class TrainerProfileSettingsController extends Controller
{
    /** "Metti in pausa per un periodo": days from today. */
    private const PAUSES = ['1w' => 7, '2w' => 14];

    /**
     * The switches are saved right away. "pause" starts a pause (1w, 2w, 1m)
     * or ends it ("none"); without it the pause stays as it is.
     */
    public function updateVisibility(Request $request): RedirectResponse
    {
        $profile = $this->profile($request);

        $data = $request->validate([
            'visible_in_search' => ['required', 'boolean'],
            'accepts_new_clients' => ['required', 'boolean'],
            'pause' => ['nullable', 'in:1w,2w,1m,none'],
        ]);

        $profile->fill([
            'visible_in_search' => (bool) $data['visible_in_search'],
            'accepts_new_clients' => (bool) $data['accepts_new_clients'],
        ]);

        if (isset($data['pause'])) {
            $today = now(TrainerSlots::TIMEZONE)->startOfDay();

            // Bookable again from midnight of that day in Rome, saved in UTC.
            $profile->paused_until = match ($data['pause']) {
                'none' => null,
                '1m' => $today->addMonth()->utc(),
                default => $today->addDays(self::PAUSES[$data['pause']])->utc(),
            };
        }

        $profile->save();

        // A pause moves the first free slot of the search.
        TrainerSlots::refresh($profile);

        return back();
    }

    /**
     * "Metti in pausa" / "Riattiva profilo": a pause without an end. The
     * profile leaves the search and nobody can book until it is turned back on.
     */
    public function updatePause(Request $request): RedirectResponse
    {
        $profile = $this->profile($request);

        $paused = $request->validate(['paused' => ['required', 'boolean']])['paused'];

        $profile->forceFill(['paused_at' => $paused ? ($profile->paused_at ?? now()) : null])->save();

        // No free slots while paused: the search reads the first one.
        TrainerSlots::refresh($profile);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $paused ? 'Profilo in pausa.' : 'Profilo riattivato.',
        ]);

        return back();
    }

    public function updateContacts(Request $request): RedirectResponse
    {
        $profile = $this->profile($request);

        $data = $request->validate([
            'show_phone' => ['required', 'boolean'],
            'show_email' => ['required', 'boolean'],
            'arrival_notes' => ['nullable', 'string', 'max:500'],
        ], [
            'arrival_notes.max' => 'Le indicazioni possono avere al massimo 500 caratteri.',
        ]);

        $profile->update([
            ...$data,
            'arrival_notes' => filled($data['arrival_notes'] ?? null) ? trim((string) $data['arrival_notes']) : null,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Contatti salvati.']);

        return back();
    }

    /**
     * "Chiudi il profilo": profile, services, hours, photos and certificates are
     * deleted, the account stays and becomes a client one again.
     *
     * TODO (step 5): cancel the upcoming bookings and email the clients (with the message).
     */
    public function close(Request $request): RedirectResponse
    {
        $request->validate(['acknowledged' => ['accepted']], [
            'acknowledged.accepted' => 'Conferma di aver capito cosa viene cancellato.',
        ]);

        /** @var User $user */
        $user = $request->user();
        $profile = $user->trainerProfile;

        DB::transaction(function () use ($user, $profile) {
            if ($profile !== null) {
                $photos = $profile->photos()->pluck('path')->all();
                $documents = $profile->documents()->whereNotNull('path')->pluck('path')->all();

                // The related rows go with it (cascade).
                $profile->delete();

                DB::afterCommit(function () use ($photos, $documents) {
                    Storage::disk(TrainerPhoto::DISK)->delete($photos);
                    Storage::disk(TrainerDocument::DISK)->delete($documents);
                });
            }

            $user->role = UserRole::Client;
            $user->save();
        });

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Profilo da trainer chiuso. Resti iscritto come cliente.',
        ]);

        return to_route('account.settings');
    }

    private function profile(Request $request): TrainerProfile
    {
        /** @var User $user */
        $user = $request->user();

        return $user->trainerProfile ?? abort(404);
    }
}
