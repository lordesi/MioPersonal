<?php

namespace App\Providers;

use App\Enums\SocialProvider;
use App\Models\User;
use App\Support\Socialite\FacebookProfileProvider;
use App\Support\Socialite\GoogleCalendarProvider;
use App\Support\Socialite\InstagramProvider;
use App\Support\Socialite\TikTokProvider;
use App\Support\Socialite\YouTubeProvider;
use App\Support\Staging;
use App\Support\Stats;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Laravel\Socialite\Contracts\Factory as Socialite;
use Laravel\Socialite\SocialiteManager;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureRateLimiting();
        $this->configureAuthEmails();
        $this->recordAcquisition();
        $this->configureSocialDrivers();
        // The staging site never sends a real email.
        Staging::trapMail();
    }

    /**
     * The drivers of "Collega Instagram / TikTok / Facebook / YouTube"
     * (App\Http\Controllers\TrainerSocialController), named as SocialProvider.
     */
    protected function configureSocialDrivers(): void
    {
        $drivers = [
            SocialProvider::Instagram->value => InstagramProvider::class,
            SocialProvider::TikTok->value => TikTokProvider::class,
            SocialProvider::Facebook->value => FacebookProfileProvider::class,
            SocialProvider::YouTube->value => YouTubeProvider::class,
            // Not a social: "Collega Google Calendar" of the trainer settings.
            'google-calendar' => GoogleCalendarProvider::class,
        ];

        // Not on Socialite::fake() of the tests.
        $this->app->afterResolving(Socialite::class, function (object $socialite) use ($drivers) {
            if (! $socialite instanceof SocialiteManager) {
                return;
            }

            foreach ($drivers as $name => $class) {
                $socialite->extend($name, fn () => $socialite->buildProvider($class, (array) config("services.{$name}")));
            }
        });
    }

    /**
     * Every sign-up (form, Google, "Diventa trainer") keeps the channel of the
     * visit it came from, saved in the session by Stats::recordPageView.
     */
    protected function recordAcquisition(): void
    {
        Event::listen(Registered::class, function (Registered $event) {
            $request = request();

            if (! $event->user instanceof User || ! $request->hasSession()) {
                return;
            }

            $acquisition = $request->session()->get(Stats::ACQUISITION_KEY) ?? Stats::acquisition($request);
            $id = $event->user->id;
            // A direct query: no model events, and `acquisition` is not fillable.
            Stats::safely(fn () => DB::table('users')->where('id', $id)->update(['acquisition' => json_encode($acquisition)]));
        });
    }

    /**
     * "Conferma la tua email" and "Reimposta la password" with the design of
     * our emails (resources/views/mail/auth) instead of Laravel's.
     */
    protected function configureAuthEmails(): void
    {
        VerifyEmail::toMailUsing(fn (User $user, string $url) => (new MailMessage)
            ->subject('Conferma la tua email')
            ->view(['mail.auth.verify-email', 'mail.auth.verify-email-text'], [
                'name' => $user->first_name,
                'url' => $url,
                'validity' => self::validity((int) config('auth.verification.expire', 60)),
            ]));

        ResetPassword::toMailUsing(fn (User $user, string $token) => (new MailMessage)
            ->subject('Reimposta la tua password')
            ->view(['mail.auth.reset-password', 'mail.auth.reset-password-text'], [
                'url' => route('password.reset', ['token' => $token, 'email' => $user->getEmailForPasswordReset()]),
                'validity' => self::validity((int) config('auth.passwords.users.expire', 60)),
            ]));
    }

    /** "Il link è valido per…": 60 → "60 minuti", 1440 → "24 ore". */
    private static function validity(int $minutes): string
    {
        return $minutes >= 120 && $minutes % 60 === 0 ? ($minutes / 60).' ore' : "{$minutes} minuti";
    }

    /**
     * The ceiling on every page, and limits per IP on the public forms that send
     * emails (a bot with many addresses could otherwise use them to mail anyone
     * from our domain).
     */
    protected function configureRateLimiting(): void
    {
        RateLimiter::for('contact', fn (Request $request) => [
            Limit::perMinute(5)->by('minute|'.$request->ip()),
            Limit::perDay(20)->by('day|'.$request->ip()),
        ]);

        // Every page of the web group: a ceiling far above what a person does,
        // so one address can't flood the server. Signed-in people by account
        // (many share a gym's wifi), the others by IP.
        RateLimiter::for('global', fn (Request $request) => $request->user()
            ? Limit::perMinute(300)->by('user|'.$request->user()->getAuthIdentifier())
            : Limit::perMinute(120)->by('ip|'.$request->ip()));

        // App\Http\Middleware\ThrottleSignups: new accounts (each gets "Conferma la tua email")…
        RateLimiter::for('signups', fn (Request $request) => Limit::perHour(10)->by($request->ip()));
        // …and "Reimposta la password" links (the broker alone limits only per address).
        RateLimiter::for('password-reset-links', fn (Request $request) => Limit::perHour(5)->by($request->ip()));
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        // Links in emails (password reset, verification) always use APP_URL over
        // HTTPS, never the Host header of the request that asked for them.
        if (app()->isProduction()) {
            URL::forceRootUrl(config()->string('app.url'));
            URL::forceScheme('https');
        }

        // The criteria listed under the password field (password-requirements.tsx):
        // the same everywhere. In production also refused if found in a data leak.
        Password::defaults(function (): Password {
            $rule = Password::min(8)->mixedCase()->numbers();

            return app()->isProduction() ? $rule->uncompromised() : $rule;
        });
    }
}
