<?php

use App\Mail\ContactMessage;
use App\Models\Booking;
use App\Models\User;
use App\Notifications\BookingChanged;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Mail\Mailer;
use Illuminate\Notifications\Messages\MailMessage;
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

    // The emails that are still sent (the others are in the bell and the push),
    // as they are sent, with the latest booking of the local database:
    // verifica, password, annullata, proposta, contatti.
    // Add ?testo for the plain text version. Nothing is sent or saved.
    Route::get('email/{name}', function (string $name) {
        $booking = Booking::query()->whereNotNull('client_id')->with('client', 'trainerProfile.user')->latest()->firstOrFail();
        /** @var User $client */
        $client = $booking->client;

        $mail = match ($name) {
            'verifica' => (new VerifyEmail)->toMail($client),
            'password' => (new ResetPassword('token-di-prova'))->toMail($client),
            'annullata' => (new BookingChanged($booking, 'cancelled-by-trainer'))->toMail($client),
            'proposta' => (new BookingChanged(tap($booking, fn (Booking $booking) => $booking->proposed_starts_at ??= now()->addDays(2)), 'proposed'))->toMail($client),
            'contatti' => (new ContactMessage([
                'roleLabel' => 'Un cliente',
                'topicLabel' => 'Prenotazioni',
                'name' => 'Luca Moretti',
                'email' => 'luca@example.com',
                'message' => "Buongiorno,\nvorrei spostare una seduta.\n\nGrazie!",
            ]))->render(),
            default => abort(404),
        };

        if ($mail instanceof MailMessage) {
            return request()->has('testo')
                ? response(app(Mailer::class)->render(['text' => $mail->view[1]], $mail->data()))->header('Content-Type', 'text/plain; charset=utf-8')
                : $mail->render();
        }

        return $mail;
    })->name('email');
});
