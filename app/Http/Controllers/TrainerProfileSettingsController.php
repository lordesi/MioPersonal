<?php

namespace App\Http\Controllers;

use App\Actions\Trainer\DeleteTrainerProfile;
use App\Enums\UserRole;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Support\TrainerSlots;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

/**
 * The trainer sections of "Impostazioni account": "Visibilità del profilo"
 * (with "Metti in pausa per un periodo"), "Contatti per i clienti" and
 * "Chiudi il profilo".
 */
class TrainerProfileSettingsController extends Controller
{
    /** "Metti in pausa per un periodo": days from today. */
    private const PAUSES = ['1w' => 7, '2w' => 14];

    /**
     * The switches are saved right away. "pause" starts a pause (1w, 2w, 1m,
     * or custom until "pause_until") or ends it ("none", "Riprendi ora");
     * without it the pause stays as it is.
     */
    public function updateVisibility(Request $request): RedirectResponse
    {
        $profile = $this->profile($request);
        $today = CarbonImmutable::now(TrainerSlots::TIMEZONE)->startOfDay();

        $data = $request->validate([
            'visible_in_search' => ['required', 'boolean'],
            'accepts_new_clients' => ['required', 'boolean'],
            'pause' => ['nullable', 'in:1w,2w,1m,custom,none'],
            // "Scegli le date": the pause starts today and ends on this day.
            'pause_until' => [
                'nullable',
                'required_if:pause,custom',
                'date_format:Y-m-d',
                'after:'.$today->toDateString(),
                'before_or_equal:'.$today->addYear()->toDateString(),
            ],
        ], [
            'pause_until.required_if' => 'Scegli fino a quando metterti in pausa.',
            'pause_until.date_format' => 'Scegli una data valida.',
            'pause_until.after' => 'Scegli un giorno a partire da domani.',
            'pause_until.before_or_equal' => 'La pausa può durare al massimo un anno.',
        ]);

        $profile->fill([
            'visible_in_search' => (bool) $data['visible_in_search'],
            'accepts_new_clients' => (bool) $data['accepts_new_clients'],
        ]);

        if (isset($data['pause'])) {
            // Bookable again from midnight of that day in Rome, saved in UTC.
            $profile->paused_until = match ($data['pause']) {
                'none' => null,
                '1m' => $today->addMonth()->utc(),
                'custom' => CarbonImmutable::parse($data['pause_until'], TrainerSlots::TIMEZONE)->startOfDay()->utc(),
                default => $today->addDays(self::PAUSES[$data['pause']])->utc(),
            };

            // "Riprendi ora" also ends the old pause without an end.
            if ($data['pause'] === 'none') {
                $profile->forceFill(['paused_at' => null]);
            }
        }

        $profile->save();

        // A pause moves the first free slot of the search.
        TrainerSlots::refresh($profile);

        return back();
    }

    /** Saved with "Salva modifiche". */
    public function updateContacts(Request $request): RedirectResponse
    {
        $profile = $this->profile($request);

        $data = $request->validate([
            'show_phone' => ['required', 'boolean'],
            'show_email' => ['required', 'boolean'],
            'arrival_notes' => ['nullable', 'string', 'max:300'],
        ], [
            'arrival_notes.max' => 'Le indicazioni possono avere al massimo 300 caratteri.',
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
     */
    public function close(Request $request, DeleteTrainerProfile $deleteProfile): RedirectResponse
    {
        $request->validate(['acknowledged' => ['accepted']], [
            'acknowledged.accepted' => 'Conferma di voler chiudere il profilo.',
        ]);

        /** @var User $user */
        $user = $request->user();
        $profile = $user->trainerProfile;

        DB::transaction(function () use ($user, $profile, $deleteProfile) {
            if ($profile !== null) {
                $deleteProfile->handle($profile);
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
