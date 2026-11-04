<?php

use App\Models\Booking;
use App\Models\User;
use App\Notifications\BookingConfirmed;
use App\Notifications\BookingRequested;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Mail\Mailer;
use Illuminate\Support\Facades\Route;

/*
| Local-only pages to compare shared components and layouts with docs/design.
| Loaded from routes/web.php only when APP_ENV=local.
*/

Route::prefix('dev')->name('dev.')->group(function () {
    Route::inertia('components', 'dev/components')->name('components');
    Route::inertia('layouts/public', 'dev/layouts/public')->name('layouts.public');
    Route::inertia('layouts/trainer', 'dev/layouts/trainer')->name('layouts.trainer');
    Route::inertia('layouts/client', 'dev/layouts/client')->name('layouts.client');

    // The emails as they are sent, with the latest booking of the local database:
    // verifica, password, nuova-richiesta, nuova-prenotazione, confermata.
    // Add ?testo for the plain text version. Nothing is sent or saved.
    Route::get('email/{name}', function (string $name) {
        $booking = Booking::query()->whereNotNull('client_id')->with('client', 'trainerProfile.user')->latest()->firstOrFail();
        /** @var User $client */
        $client = $booking->client;
        // A confirmed booking has no deadline anymore: one for the "nuova-richiesta" preview.
        $booking->expires_at ??= now()->addDay();

        $request = new BookingRequested($booking);
        $request->alreadyConfirmed = $name === 'nuova-prenotazione';

        $mail = match ($name) {
            'verifica' => (new VerifyEmail)->toMail($client),
            'password' => (new ResetPassword('token-di-prova'))->toMail($client),
            'nuova-richiesta', 'nuova-prenotazione' => $request->toMail($booking->trainerProfile->user),
            'confermata' => (new BookingConfirmed($booking))->toMail($client),
            default => abort(404),
        };

        return request()->has('testo')
            ? response(app(Mailer::class)->render(['text' => $mail->view[1]], $mail->data()))->header('Content-Type', 'text/plain; charset=utf-8')
            : $mail->render();
    })->name('email');
});
