<?php

namespace App\Http\Controllers\Auth;

use App\Actions\Fortify\CreateNewUser;
use App\Concerns\ProfileValidationRules;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Providers\FortifyServiceProvider;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Fortify\Events\TwoFactorAuthenticationChallenged;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as GoogleUser;
use Symfony\Component\HttpFoundation\RedirectResponse as SymfonyRedirect;
use Throwable;

/**
 * "Continua con Google" / "Registrati con Google" (Laravel Socialite).
 *
 * 1. redirect(): the user goes to Google and chooses an account.
 * 2. callback(): Google sends them back here. An account already linked, or
 *    with the same email, is logged in; otherwise the Google data is kept in
 *    the session and the user goes to "Completa la registrazione".
 * 3. create() / store(): that page, where the user accepts the Terms (as in
 *    the normal sign-up) and adds the phone (required). Then the client account is made.
 */
class GoogleAuthController extends Controller
{
    use ProfileValidationRules;

    /** Session key with the Google data while the sign-up is completed. */
    private const SESSION_KEY = 'google_sign_up';

    public function redirect(): SymfonyRedirect
    {
        abort_unless(FortifyServiceProvider::googleEnabled(), 404);

        return Socialite::driver('google')->redirect();
    }

    public function callback(Request $request): RedirectResponse
    {
        abort_unless(FortifyServiceProvider::googleEnabled(), 404);

        try {
            /** @var GoogleUser $googleUser */
            $googleUser = Socialite::driver('google')->user();
        } catch (Throwable) {
            // Cancelled on Google, or the link was opened twice.
            return to_route('login')->with('status', 'Accesso con Google non riuscito. Riprova.');
        }

        $email = CreateNewUser::normalizeEmail($googleUser->getEmail());

        if ($email === '' || ! ($googleUser->user['email_verified'] ?? false)) {
            return to_route('login')->with('status', 'Il tuo account Google non ha un\'email verificata: accedi con email e password.');
        }

        $user = User::where('google_id', $googleUser->getId())->first()
            ?? User::where('email', $email)->first();

        if ($user !== null) {
            // Google has verified the email: it is safe to link the two accounts.
            $user->forceFill([
                'google_id' => $googleUser->getId(),
                'email_verified_at' => $user->email_verified_at ?? now(),
            ])->save();

            return $this->logIn($request, $user);
        }

        $request->session()->put(self::SESSION_KEY, [
            'google_id' => $googleUser->getId(),
            'email' => $email,
            'first_name' => (string) ($googleUser->user['given_name'] ?? ''),
            'last_name' => (string) ($googleUser->user['family_name'] ?? ''),
        ]);

        return to_route('google.register');
    }

    public function create(Request $request): Response|RedirectResponse
    {
        $data = $request->session()->get(self::SESSION_KEY);

        if ($data === null) {
            return to_route('register');
        }

        return Inertia::render('auth/google-sign-up', [
            'email' => $data['email'],
            'firstName' => $data['first_name'],
            'lastName' => $data['last_name'],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        /** @var array{google_id: string, email: string, first_name: string, last_name: string}|null $data */
        $data = $request->session()->get(self::SESSION_KEY);

        if ($data === null) {
            return to_route('register');
        }

        $request->validate([
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'phone_prefix' => $this->phonePrefixRules(),
            'phone' => $this->phoneNumberRules(),
            'terms' => ['accepted'],
        ]);

        // Someone signed up with this email in the meantime.
        if (User::where('email', $data['email'])->exists()) {
            $request->session()->forget(self::SESSION_KEY);

            return to_route('login')->with('status', 'Esiste già un account con questa email: accedi.');
        }

        $user = User::create([
            'first_name' => trim($request->string('first_name')->value()),
            'last_name' => trim($request->string('last_name')->value()),
            'email' => $data['email'],
            'phone' => CreateNewUser::phoneWithPrefix($request->input('phone_prefix'), $request->input('phone')),
            // When the consent was given, as the GDPR asks.
            'terms_accepted_at' => now(),
        ]);
        $user->forceFill([
            'google_id' => $data['google_id'],
            'email_verified_at' => now(),
        ])->save();

        $request->session()->forget(self::SESSION_KEY);

        event(new Registered($user));

        Auth::login($user, remember: true);
        $request->session()->regenerate();

        // Where Fortify sends the normal sign-up: "Completa il tuo profilo".
        return redirect()->to(config()->string('fortify.redirects.register'));
    }

    /** Like the email login: who turned on two-factor authentication still has to type the code. */
    private function logIn(Request $request, User $user): RedirectResponse
    {
        if ($user->hasEnabledTwoFactorAuthentication()) {
            $request->session()->put([
                'login.id' => $user->getKey(),
                'login.remember' => true,
            ]);

            TwoFactorAuthenticationChallenged::dispatch($user);

            return to_route('two-factor.login');
        }

        Auth::login($user, remember: true);
        $request->session()->regenerate();

        return redirect()->intended(config('fortify.home'));
    }
}
