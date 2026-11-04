<?php

// Anteprima delle email nel browser, SOLO in locale.
// Incolla in fondo a routes/web.php e apri: http://localhost:8000/_email/booking.confirmed

use Illuminate\Support\Facades\Route;

if (app()->isLocal()) {
    Route::get('/_email/{name}', function (string $name) {
        $booking = [
            'trainerName' => 'Alessandro Siligato', 'clientName' => 'Giorgio Montana', 'isNewClient' => true,
            'weekday' => 'mer', 'day' => '28', 'month' => 'ott', 'time' => '13:00–13:30',
            'service' => 'Prima seduta', 'place' => 'Online', 'price' => 'Gratis', 'cancelPolicy' => 'Fino a 24 ore prima',
            'expiresAt' => 'gio 29 ott alle 18:30', 'clientNote' => 'Vorrei iniziare con la tecnica di squat e panca.',
            'trainerPhone' => '+39 391 239 1238', 'trainerEmail' => 'alesig@zesty.it',
            'trainerNotes' => 'Ti mando il link della videochiamata 10 minuti prima.',
            'cancelUntil' => 'mar 27 ott alle 13:00', 'reason' => 'expired',
            'url' => url('/'), 'searchUrl' => url('/'),
        ];

        $samples = [
            'auth.verify-email' => ['url' => url('/email/verify/1/esempio'), 'name' => 'Giorgio', 'minutes' => 60],
            'auth.reset-password' => ['url' => url('/reset-password/esempio'), 'minutes' => 60],
            'booking.request-sent' => $booking,
            'booking.new-request' => $booking,
            'booking.confirmed' => $booking,
            'booking.not-confirmed' => $booking,
        ];

        abort_unless(isset($samples[$name]), 404);

        return view('emails.'.$name, $samples[$name]);
    });
}
