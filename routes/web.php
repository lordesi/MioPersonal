<?php

use App\Http\Controllers\AccountSettingsController;
use App\Http\Controllers\Admin\AdminBookingsController;
use App\Http\Controllers\Admin\AdminCatalogController;
use App\Http\Controllers\Admin\AdminCityController;
use App\Http\Controllers\Admin\AdminDisciplineController;
use App\Http\Controllers\Admin\AdminMessagesController;
use App\Http\Controllers\Admin\AdminOverviewController;
use App\Http\Controllers\Admin\AdminReviewsController;
use App\Http\Controllers\Admin\AdminSettingsController;
use App\Http\Controllers\Admin\AdminUsersController;
use App\Http\Controllers\Admin\AdminVerificationController;
use App\Http\Controllers\Auth\GoogleAuthController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\BookingSentController;
use App\Http\Controllers\ClientCalendarController;
use App\Http\Controllers\ClientFavoritesController;
use App\Http\Controllers\ClientHomeController;
use App\Http\Controllers\ClientReviewController;
use App\Http\Controllers\CompleteProfileController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\FavoriteController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\TrainerAvailabilityController;
use App\Http\Controllers\TrainerBookingRequestController;
use App\Http\Controllers\TrainerCalendarController;
use App\Http\Controllers\TrainerClientProfileController;
use App\Http\Controllers\TrainerClientsController;
use App\Http\Controllers\TrainerDashboardController;
use App\Http\Controllers\TrainerNoShowController;
use App\Http\Controllers\TrainerPastSessionsController;
use App\Http\Controllers\TrainerPhotoController;
use App\Http\Controllers\TrainerProfileController;
use App\Http\Controllers\TrainerProfileEditController;
use App\Http\Controllers\TrainerProfileSettingsController;
use App\Http\Controllers\TrainerRegistrationController;
use App\Http\Controllers\TrainerRequestsController;
use App\Http\Controllers\TrainerReviewsController;
use App\Http\Controllers\TrainerSearchController;
use App\Http\Controllers\TrainerServicesController;
use App\Http\Controllers\TrainerSettingsController;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/', HomeController::class)->name('home');
// /personal-trainer = all of Italy, /personal-trainer/roma = one city (404 if unknown).
Route::get('personal-trainer/{city:slug?}', TrainerSearchController::class)->name('trainers.search');
Route::get('trainer/{slug}', TrainerProfileController::class)->name('trainers.show');
// "Prenota questo slot" for guests: login or sign-up, then back to the profile.
Route::get('trainer/{slug}/prenota', [BookingController::class, 'start'])->middleware('auth')->name('trainers.book.start');

// Legal pages: drafts to be checked by a lawyer before the launch.
Route::inertia('privacy', 'public/privacy')->name('legal.privacy');
Route::inertia('termini', 'public/terms')->name('legal.terms');
Route::inertia('cookie', 'public/cookies')->name('legal.cookies');

// "Continua con Google": see App\Http\Controllers\Auth\GoogleAuthController.
Route::middleware('guest')->controller(GoogleAuthController::class)->group(function () {
    Route::get('auth/google', 'redirect')->name('google.redirect');
    Route::get('auth/google/callback', 'callback')->name('google.callback');
    Route::get('registrazione/google', 'create')->name('google.register');
    Route::post('registrazione/google', 'store')->name('google.register.store');
});

Route::get('contatti', [ContactController::class, 'show'])->name('contact.show');
Route::post('contatti', [ContactController::class, 'store'])
    ->middleware('throttle:5,1')
    ->name('contact.store');

// Guests create a trainer account, logged-in clients turn theirs into a trainer one;
// the controller sends trainers and admins to their area. After sending, the same
// page shows "Profilo inviato".
Route::get('registrazione-trainer', [TrainerRegistrationController::class, 'show'])->name('trainer.register');
Route::post('registrazione-trainer', [TrainerRegistrationController::class, 'store'])->name('trainer.register.store');

// Clients right after sign-up, before the email is verified.
Route::middleware(['auth', 'role:client'])->group(function () {
    Route::controller(CompleteProfileController::class)->group(function () {
        Route::get('completa-profilo', 'show')->name('client.complete-profile');
        Route::put('completa-profilo', 'update')->name('client.complete-profile.update');
        Route::post('completa-profilo/foto', 'updatePhoto')->name('client.complete-profile.photo');
        Route::delete('completa-profilo/foto', 'destroyPhoto')->name('client.complete-profile.photo.destroy');
    });

    // Booking right after sign-up is allowed: "Prenotazione inviata" asks to verify the email.
    Route::post('trainer/{slug}/prenota', [BookingController::class, 'store'])
        ->middleware('throttle:10,1')
        ->name('trainers.book');
    Route::get('prenotazioni/{booking}/inviata', BookingSentController::class)
        ->whereNumber('booking')
        ->name('client.bookings.sent');
    Route::patch('prenotazioni/{booking}/annulla', [BookingController::class, 'cancel'])
        ->whereNumber('booking')
        ->name('client.bookings.cancel');
    // "Aggiungi al calendario": the .ics file of a confirmed session.
    Route::get('prenotazioni/{booking}/calendario', ClientCalendarController::class)
        ->whereNumber('booking')
        ->name('client.bookings.calendar');

    // The heart on search cards and profiles.
    Route::post('preferiti/{slug}', [FavoriteController::class, 'store'])->name('client.favorites.store');
    Route::delete('preferiti/{slug}', [FavoriteController::class, 'destroy'])->name('client.favorites.destroy');
});

Route::middleware(['auth', 'verified'])->group(function () {
    // Fortify sends users here after login: each role starts in its own area.
    Route::get('dashboard', function (Request $request) {
        /** @var User $user */
        $user = $request->user();

        return to_route($user->role->homeRoute());
    })->name('dashboard');

    // A wrong role is sent to its own area (see EnsureUserHasRole).
    Route::middleware('role:client')->group(function () {
        // "Le mie prenotazioni", the first page after the login.
        Route::get('area-cliente', ClientHomeController::class)->name('client.home');
        // The old address of "Le mie prenotazioni", still in the links already sent.
        Route::get('prenotazioni', fn () => to_route('client.home'))->name('client.bookings');
        // Public on the trainer's profile: only with a verified email.
        Route::post('prenotazioni/{booking}/recensione', [ClientReviewController::class, 'store'])
            ->whereNumber('booking')
            ->middleware('throttle:10,1')
            ->name('client.bookings.review');
        Route::get('preferiti', ClientFavoritesController::class)->name('client.favorites');
        // "Modifica il mio profilo": the answers of "Completa il tuo profilo", inside the client area.
        Route::controller(CompleteProfileController::class)->group(function () {
            Route::get('profilo', 'edit')->name('client.profile');
            Route::put('profilo', 'update')->name('client.profile.update');
        });
        Route::get('impostazioni', [AccountSettingsController::class, 'show'])->name('account.settings');
    });

    // Saved from both the client and the trainer settings page.
    Route::prefix('impostazioni')->name('account.')->controller(AccountSettingsController::class)->group(function () {
        Route::patch('dati-personali', 'updatePersonal')->name('personal.update');
        Route::put('password', 'updatePassword')->middleware('throttle:6,1')->name('password.update');
    });

    Route::middleware('role:trainer')->prefix('area-trainer')->name('trainer.')->group(function () {
        Route::get('/', TrainerDashboardController::class)->name('today');
        // "Vedi tutte" of the last 7 days in "Panoramica".
        Route::get('sedute-passate', TrainerPastSessionsController::class)->name('past-sessions');
        Route::get('richieste', TrainerRequestsController::class)->name('requests');
        // The answer to a booking request, from "Richieste".
        Route::controller(TrainerBookingRequestController::class)->prefix('richieste/{booking}')->whereNumber('booking')->group(function () {
            Route::post('accetta', 'accept')->name('requests.accept');
            Route::post('rifiuta', 'decline')->name('requests.decline');
        });
        // "Saltata" on a finished session, from "Panoramica" and "Sedute passate" (within 7 days).
        Route::controller(TrainerNoShowController::class)->prefix('sedute/{booking}/saltata')->whereNumber('booking')->group(function () {
            Route::post('/', 'store')->name('sessions.no-show');
            Route::delete('/', 'destroy')->name('sessions.no-show.destroy');
        });
        Route::get('calendario', TrainerCalendarController::class)->name('calendar');
        Route::get('clienti', TrainerClientsController::class)->name('clients');
        // Only clients who booked with this trainer (404 for the others).
        Route::get('clienti/{client}', TrainerClientProfileController::class)->whereNumber('client')->name('clients.show');
        Route::controller(TrainerAvailabilityController::class)->group(function () {
            Route::get('disponibilita', 'show')->name('availability');
            Route::put('disponibilita', 'update')->name('availability.update');
        });
        // "Servizi e prezzi": public right away, without a new review.
        Route::controller(TrainerServicesController::class)->group(function () {
            Route::get('servizi', 'show')->name('services');
            Route::put('servizi', 'update')->name('services.update');
        });
        // "Modifica profilo": public right away, without a new review.
        Route::controller(TrainerProfileEditController::class)->group(function () {
            Route::get('profilo', 'show')->name('profile.edit');
            Route::put('profilo', 'update')->name('profile.update');
        });
        // "Foto della galleria" of "Modifica profilo": each action is saved right away.
        Route::controller(TrainerPhotoController::class)->prefix('profilo/foto')->name('photos.')->group(function () {
            Route::post('/', 'store')->name('store');
            Route::delete('{photo}', 'destroy')->whereNumber('photo')->name('destroy');
        });
        Route::controller(TrainerReviewsController::class)->group(function () {
            Route::get('recensioni', 'show')->name('reviews');
            // The public reply under a review.
            Route::post('recensioni/{review}/risposta', 'reply')->whereNumber('review')->name('reviews.reply');
        });
        Route::get('impostazioni', TrainerSettingsController::class)->name('settings');
        Route::controller(TrainerProfileSettingsController::class)->group(function () {
            Route::patch('impostazioni/visibilita', 'updateVisibility')->name('visibility.update');
            Route::patch('impostazioni/contatti', 'updateContacts')->name('contacts.update');
            // "Metti in pausa" / "Riattiva profilo".
            Route::patch('impostazioni/pausa', 'updatePause')->name('pause.update');
            // "Chiudi il profilo": the account becomes a client one again.
            Route::delete('profilo', 'close')->name('profile.close');
        });
    });
});

// Only for the MioPersonal team: give access with `php artisan admin:grant {email}`.
Route::middleware(['auth', 'verified', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', AdminOverviewController::class)->name('overview');
    Route::get('verifica', AdminVerificationController::class)->name('verification');
    Route::post('verifica/{profile}/decisione', [AdminVerificationController::class, 'decide'])->name('verification.decide');
    // Certificates are private: only with the temporary link of the page.
    Route::get('verifica/attestati/{document}', [AdminVerificationController::class, 'certificate'])
        ->middleware('signed')
        ->name('verification.certificate');
    Route::get('messaggi', AdminMessagesController::class)->name('messages');
    Route::get('prenotazioni', AdminBookingsController::class)->name('bookings');
    Route::get('utenti', AdminUsersController::class)->name('users');
    Route::get('recensioni', AdminReviewsController::class)->name('reviews');
    Route::get('discipline-e-zone', AdminCatalogController::class)->name('catalog');
    // Disciplines and cities are hidden, never deleted (trainers may use them).
    Route::post('discipline', [AdminDisciplineController::class, 'store'])->name('disciplines.store');
    Route::patch('discipline/{discipline}', [AdminDisciplineController::class, 'update'])->name('disciplines.update');
    Route::post('discipline/{discipline}/sposta', [AdminDisciplineController::class, 'move'])->name('disciplines.move');
    Route::post('citta', [AdminCityController::class, 'store'])->name('cities.store');
    Route::patch('citta/{city}', [AdminCityController::class, 'update'])->name('cities.update');
    Route::get('impostazioni', AdminSettingsController::class)->name('settings');
});

require __DIR__.'/settings.php';

if (app()->isLocal()) {
    require __DIR__.'/dev.php';
}
