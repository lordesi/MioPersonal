<?php

namespace App\Providers;

use App\Models\User;
use App\Support\Stats;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

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
     * Limits per IP on the public forms that send emails (a bot with many
     * addresses could otherwise use them to mail anyone from our domain).
     */
    protected function configureRateLimiting(): void
    {
        RateLimiter::for('contact', fn (Request $request) => [
            Limit::perMinute(5)->by('minute|'.$request->ip()),
            Limit::perDay(20)->by('day|'.$request->ip()),
        ]);
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
