<?php

use App\Http\Controllers\AccountSettingsController;
use App\Http\Controllers\Admin\AdminBookingsController;
use App\Http\Controllers\Admin\AdminCatalogController;
use App\Http\Controllers\Admin\AdminMessagesController;
use App\Http\Controllers\Admin\AdminOverviewController;
use App\Http\Controllers\Admin\AdminReviewsController;
use App\Http\Controllers\Admin\AdminSettingsController;
use App\Http\Controllers\Admin\AdminUsersController;
use App\Http\Controllers\Admin\AdminVerificationController;
use App\Http\Controllers\BookingSentController;
use App\Http\Controllers\ClientBookingsController;
use App\Http\Controllers\ClientFavoritesController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\QuizController;
use App\Http\Controllers\TrainerAvailabilityController;
use App\Http\Controllers\TrainerCalendarController;
use App\Http\Controllers\TrainerClientsController;
use App\Http\Controllers\TrainerDashboardController;
use App\Http\Controllers\TrainerProfileController;
use App\Http\Controllers\TrainerRegistrationController;
use App\Http\Controllers\TrainerReviewsController;
use App\Http\Controllers\TrainerSearchController;
use App\Http\Controllers\TrainerSettingsController;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/', HomeController::class)->name('home');
Route::get('personal-trainer/milano', TrainerSearchController::class)->name('trainers.search');
Route::get('trainer/{slug}', TrainerProfileController::class)->name('trainers.show');

// Legal pages: drafts to be checked by a lawyer before the launch.
Route::inertia('privacy', 'public/privacy')->name('legal.privacy');
Route::inertia('termini', 'public/terms')->name('legal.terms');
Route::inertia('cookie', 'public/cookies')->name('legal.cookies');

Route::get('contatti', [ContactController::class, 'show'])->name('contact.show');
Route::post('contatti', [ContactController::class, 'store'])
    ->middleware('throttle:5,1')
    ->name('contact.store');

Route::get('quiz', [QuizController::class, 'show'])->name('quiz.show');
Route::get('quiz/risultati', [QuizController::class, 'results'])->name('quiz.results');

// Guests create a trainer account, logged-in clients turn theirs into a trainer one;
// the controller sends trainers and admins to their area. After sending, the same
// page shows "Profilo inviato".
Route::get('registrazione-trainer', [TrainerRegistrationController::class, 'show'])->name('trainer.register');
Route::post('registrazione-trainer', [TrainerRegistrationController::class, 'store'])->name('trainer.register.store');

// Clients right after sign-up, before the email is verified.
Route::middleware(['auth', 'role:client'])->group(function () {
    Route::inertia('completa-profilo', 'onboarding/complete-profile')->name('client.complete-profile');

    // The page itself asks to verify the email, so it can't require a verified one.
    Route::get('prenotazioni/{booking}/inviata', BookingSentController::class)
        ->whereNumber('booking')
        ->name('client.bookings.sent');
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
        Route::get('prenotazioni', ClientBookingsController::class)->name('client.bookings');
        Route::get('preferiti', ClientFavoritesController::class)->name('client.favorites');
        Route::get('impostazioni', [AccountSettingsController::class, 'show'])->name('account.settings');
    });

    // Saved from both the client and the trainer settings page.
    Route::prefix('impostazioni')->name('account.')->controller(AccountSettingsController::class)->group(function () {
        Route::patch('dati-personali', 'updatePersonal')->name('personal.update');
        Route::patch('email', 'updateEmail')->name('email.update');
        Route::put('password', 'updatePassword')->middleware('throttle:6,1')->name('password.update');
    });

    Route::middleware('role:trainer')->prefix('area-trainer')->name('trainer.')->group(function () {
        Route::get('/', TrainerDashboardController::class)->name('today');
        Route::get('calendario', TrainerCalendarController::class)->name('calendar');
        Route::get('clienti', TrainerClientsController::class)->name('clients');
        Route::get('disponibilita', TrainerAvailabilityController::class)->name('availability');
        Route::get('recensioni', TrainerReviewsController::class)->name('reviews');
        Route::get('impostazioni', TrainerSettingsController::class)->name('settings');
    });
});

// Only for the MioPersonal team: give access with `php artisan admin:grant {email}`.
Route::middleware(['auth', 'verified', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', AdminOverviewController::class)->name('overview');
    Route::get('verifica', AdminVerificationController::class)->name('verification');
    Route::get('messaggi', AdminMessagesController::class)->name('messages');
    Route::get('prenotazioni', AdminBookingsController::class)->name('bookings');
    Route::get('utenti', AdminUsersController::class)->name('users');
    Route::get('recensioni', AdminReviewsController::class)->name('reviews');
    Route::get('discipline-e-zone', AdminCatalogController::class)->name('catalog');
    Route::get('impostazioni', AdminSettingsController::class)->name('settings');
});

require __DIR__.'/settings.php';

if (app()->isLocal()) {
    require __DIR__.'/dev.php';
}
