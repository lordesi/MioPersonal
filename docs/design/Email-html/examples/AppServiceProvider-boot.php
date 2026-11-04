<?php

// Da incollare in app/Providers/AppServiceProvider.php
// 1) in cima al file, insieme agli altri "use":

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;

// 2) dentro il metodo boot():

public function boot(): void
{
    // Email "Conferma la tua email" (sostituisce quella standard di Laravel)
    VerifyEmail::toMailUsing(function (object $notifiable, string $url) {
        return (new MailMessage)
            ->subject('Conferma la tua email')
            ->view(['emails.auth.verify-email', 'emails.auth.verify-email-text'], [
                'url' => $url,
                'name' => $notifiable->first_name ?? null, // cambia con il campo del nome, oppure lascia null
                'minutes' => config('auth.verification.expire', 60),
            ]);
    });

    // Email "Reimposta la password"
    ResetPassword::toMailUsing(function (object $notifiable, string $token) {
        $url = url(route('password.reset', [
            'token' => $token,
            'email' => $notifiable->getEmailForPasswordReset(),
        ], false));

        return (new MailMessage)
            ->subject('Reimposta la password')
            ->view(['emails.auth.reset-password', 'emails.auth.reset-password-text'], [
                'url' => $url,
                'minutes' => config('auth.passwords.'.config('auth.defaults.passwords').'.expire', 60),
            ]);
    });
}
