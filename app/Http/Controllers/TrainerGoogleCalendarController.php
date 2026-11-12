<?php

namespace App\Http\Controllers;

use App\Jobs\SyncBusyTimesJob;
use App\Jobs\SyncCalendarJob;
use App\Models\TrainerCalendarConnection;
use App\Models\User;
use App\Support\Calendar\GoogleCalendar;
use App\Support\Socialite\GoogleCalendarProvider;
use App\Support\TrainerSlots;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as OAuthTwoUser;
use Symfony\Component\HttpFoundation\RedirectResponse as SymfonyRedirect;
use Throwable;

/**
 * "Collega Google Calendar" in the trainer settings. The sessions and events
 * are written on a calendar "MioPersonal" made on the trainer's Google
 * account. See App\Actions\Calendar\SyncCalendar.
 *
 * 1. connect(): the trainer goes to Google and allows the app to make
 *    and fill its own calendar, nothing else.
 * 2. callback(): Google sends them back; the tokens are kept (encrypted)
 *    and the sessions to come are written in the background.
 * 3. disconnect(): the "MioPersonal" calendar is deleted from Google and the tokens here.
 *
 * Optional, the other way: "Blocca gli orari occupati" goes through connect()
 * again (?occupato=1) to allow reading when the trainer is busy; disableBusy()
 * turns it off. See App\Actions\Calendar\SyncBusyTimes.
 */
class TrainerGoogleCalendarController extends Controller
{
    /** Session key: the link was asked for "Blocca gli orari occupati". */
    private const BUSY_REQUESTED = 'google_calendar_busy_requested';

    public function connect(Request $request): SymfonyRedirect
    {
        abort_unless(self::enabled(), 404);

        /** @var GoogleCalendarProvider $driver */
        $driver = Socialite::driver('google-calendar');

        // "Blocca gli orari occupati": the same link, with the permission to read when
        // they're busy. Also on "Ricollega" while it's on, not to lose it.
        /** @var User $user */
        $user = $request->user();
        $busy = $request->boolean('occupato') || ($user->trainerProfile?->calendarConnection?->readsBusy() ?? false);
        $request->session()->put(self::BUSY_REQUESTED, $busy);

        if ($busy) {
            $driver->scopes(GoogleCalendarProvider::BUSY_SCOPES)->with(['include_granted_scopes' => 'true']);
        }

        return $driver->redirect();
    }

    public function callback(Request $request): RedirectResponse
    {
        abort_unless(self::enabled(), 404);

        /** @var User $user */
        $user = $request->user();
        $profile = $user->trainerProfile;

        abort_if($profile === null, 404);

        $busyRequested = (bool) $request->session()->pull(self::BUSY_REQUESTED, false);

        try {
            $account = Socialite::driver('google-calendar')->user();
        } catch (Throwable) {
            return $this->done('error', 'Collegamento con Google non riuscito. Riprova.');
        }

        // An OAuth 2 account: the only kind with the tokens to keep.
        if (! $account instanceof OAuthTwoUser) {
            return $this->done('error', 'Collegamento con Google non riuscito. Riprova.');
        }

        // The permission to write is its own checkbox on the Google screen: it can be left off.
        // Socialite says array, but it is unset when Google sends no scopes.
        $scopes = (array) ($account->approvedScopes ?: []);

        if ($scopes !== [] && ! in_array(GoogleCalendarProvider::SCOPE, $scopes, true)) {
            return $this->done('error', 'Per collegare il calendario devi consentire a MioPersonal di gestire il suo calendario.');
        }

        $existing = $profile->calendarConnection;
        $refresh = $account->refreshToken ?: $existing?->refresh_token;

        if ($refresh === null) {
            return $this->done('error', 'Google non ci ha dato il permesso di restare collegati. Riprova e consenti tutto.');
        }

        // Another Google account than before: the calendar of the old one is not ours any more.
        $sameAccount = $existing !== null && $existing->google_user_id === (string) $account->getId();

        $connection = $profile->calendarConnection()->updateOrCreate([], [
            'google_user_id' => (string) $account->getId(),
            'google_email' => (string) $account->getEmail(),
            'access_token' => $account->token,
            'refresh_token' => $refresh,
            // Socialite says int, but it is null when Google sends no "expires_in".
            'token_expires_at' => now()->addSeconds((int) ($account->expiresIn ?: 3600)),
            'calendar_id' => $sameAccount ? $existing->calendar_id : null,
            'last_error' => null,
            'connected_at' => now(),
        ]);

        if (! $sameAccount) {
            $connection->events()->delete();
            // The busy times were of the other account.
            $connection->busyTimes()->delete();
            $connection->forceFill(['reads_busy_at' => null, 'busy_synced_at' => null])->save();
        }

        SyncCalendarJob::dispatch('connection', $connection->id);

        if ($busyRequested) {
            if ($scopes !== [] && array_diff(GoogleCalendarProvider::BUSY_SCOPES, $scopes) !== []) {
                $connection->busyTimes()->delete();
                $connection->forceFill(['reads_busy_at' => null, 'busy_synced_at' => null])->save();

                return $this->done('error', 'Calendario collegato, ma per bloccare gli orari occupati devi consentire a MioPersonal di vedere quando sei impegnato.');
            }

            $connection->forceFill(['reads_busy_at' => now()])->save();
            SyncBusyTimesJob::dispatch($connection->id);

            return $this->done('success', 'Fatto: gli orari in cui sei occupato su Google non si possono più prenotare.');
        }

        return $this->done('success', "Google Calendar collegato: {$connection->google_email}. Le tue sedute compaiono nel calendario \"".TrainerCalendarConnection::CALENDAR_NAME.'".');
    }

    /** "Blocca gli orari occupati" off: the times go and are no longer read. */
    public function disableBusy(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $profile = $user->trainerProfile;
        $connection = $profile?->calendarConnection;

        if ($connection !== null) {
            DB::transaction(function () use ($connection) {
                $connection->busyTimes()->delete();
                $connection->forceFill(['reads_busy_at' => null, 'busy_synced_at' => null])->save();
            });
            TrainerSlots::refresh($profile);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Gli orari occupati su Google non bloccano più le prenotazioni.']);

        return back();
    }

    public function disconnect(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $connection = $user->trainerProfile?->calendarConnection;

        if ($connection !== null) {
            (new GoogleCalendar($connection))->disconnect();
            $connection->delete();
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Google Calendar scollegato.']);

        return back();
    }

    /** Off until the Google client is in the .env, like "Continua con Google". */
    public static function enabled(): bool
    {
        return filled(config('services.google-calendar.client_id'));
    }

    private function done(string $type, string $message): RedirectResponse
    {
        Inertia::flash('toast', ['type' => $type, 'message' => $message]);

        return to_route('trainer.settings');
    }
}
