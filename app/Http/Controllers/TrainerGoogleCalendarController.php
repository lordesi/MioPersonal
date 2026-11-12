<?php

namespace App\Http\Controllers;

use App\Jobs\SyncCalendarJob;
use App\Models\TrainerCalendarConnection;
use App\Models\User;
use App\Support\Calendar\GoogleCalendar;
use App\Support\Socialite\GoogleCalendarProvider;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as OAuthTwoUser;
use Symfony\Component\HttpFoundation\RedirectResponse as SymfonyRedirect;
use Throwable;

/**
 * "Collega Google Calendar" in the trainer settings. The sessions and events
 * are written on a calendar "MioPersonal" made on the trainer's Google
 * account (one way: the site writes, never reads). See App\Actions\Calendar\SyncCalendar.
 *
 * 1. connect(): the trainer goes to Google and allows the app to make
 *    and fill its own calendar, nothing else.
 * 2. callback(): Google sends them back; the tokens are kept (encrypted)
 *    and the sessions to come are written in the background.
 * 3. disconnect(): the "MioPersonal" calendar is deleted from Google and the tokens here.
 */
class TrainerGoogleCalendarController extends Controller
{
    public function connect(): SymfonyRedirect
    {
        abort_unless(self::enabled(), 404);

        return Socialite::driver('google-calendar')->redirect();
    }

    public function callback(Request $request): RedirectResponse
    {
        abort_unless(self::enabled(), 404);

        /** @var User $user */
        $user = $request->user();
        $profile = $user->trainerProfile;

        abort_if($profile === null, 404);

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
        }

        SyncCalendarJob::dispatch('connection', $connection->id);

        return $this->done('success', "Google Calendar collegato: {$connection->google_email}. Le tue sedute compaiono nel calendario \"".TrainerCalendarConnection::CALENDAR_NAME.'".');
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
