<?php

namespace App\Providers;

use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
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
        $this->configureAuthEmails();
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
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        // The criteria listed under the password field (password-requirements.tsx):
        // the same everywhere. In production also refused if found in a data leak.
        Password::defaults(function (): Password {
            $rule = Password::min(8)->mixedCase()->numbers();

            return app()->isProduction() ? $rule->uncompromised() : $rule;
        });
    }
}
