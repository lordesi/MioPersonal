<?php

use App\Http\Controllers\AccountSettingsController;
use App\Http\Controllers\Admin\AdminBookingsController;
use App\Http\Controllers\Admin\AdminCatalogController;
use App\Http\Controllers\Admin\AdminCityController;
use App\Http\Controllers\Admin\AdminDisciplineController;
use App\Http\Controllers\Admin\AdminEventsController;
use App\Http\Controllers\Admin\AdminGymVerificationController;
use App\Http\Controllers\Admin\AdminMessagesController;
use App\Http\Controllers\Admin\AdminOverviewController;
use App\Http\Controllers\Admin\AdminReportsController;
use App\Http\Controllers\Admin\AdminReviewsController;
use App\Http\Controllers\Admin\AdminSettingsController;
use App\Http\Controllers\Admin\AdminStatsController;
use App\Http\Controllers\Admin\AdminUsersController;
use App\Http\Controllers\Admin\AdminUserStatusController;
use App\Http\Controllers\Admin\AdminVerificationController;
use App\Http\Controllers\AppStartController;
use App\Http\Controllers\Auth\GoogleAuthController;
use App\Http\Controllers\Auth\RegistrationCheckController;
use App\Http\Controllers\Auth\UsernameController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\BookingInviteController;
use App\Http\Controllers\BookingSentController;
use App\Http\Controllers\ClientBookingsController;
use App\Http\Controllers\ClientFavoritesController;
use App\Http\Controllers\ClientHomeController;
use App\Http\Controllers\ClientProgressController;
use App\Http\Controllers\ClientRescheduleController;
use App\Http\Controllers\ClientReviewController;
use App\Http\Controllers\ClientSessionProposalController;
use App\Http\Controllers\ClientSharingController;
use App\Http\Controllers\CompleteProfileController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\CookieConsentController;
use App\Http\Controllers\CourseSearchController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\EventSearchController;
use App\Http\Controllers\FavoriteController;
use App\Http\Controllers\GymAmenitiesController;
use App\Http\Controllers\GymCoursePhotoController;
use App\Http\Controllers\GymCoursesController;
use App\Http\Controllers\GymDashboardController;
use App\Http\Controllers\GymFavoriteController;
use App\Http\Controllers\GymPhotoController;
use App\Http\Controllers\GymPlansController;
use App\Http\Controllers\GymProfileController;
use App\Http\Controllers\GymProfileEditController;
use App\Http\Controllers\GymPromotionsController;
use App\Http\Controllers\GymRegistrationController;
use App\Http\Controllers\GymSearchController;
use App\Http\Controllers\GymSettingsController;
use App\Http\Controllers\GymTrainersController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\HowItWorksController;
use App\Http\Controllers\IndexNowKeyController;
use App\Http\Controllers\LlmsTxtController;
use App\Http\Controllers\MessagesController;
use App\Http\Controllers\NewsController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OrganizerEventsController;
use App\Http\Controllers\PushSubscriptionController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\RobotsController;
use App\Http\Controllers\SitemapController;
use App\Http\Controllers\TrainerAvailabilityController;
use App\Http\Controllers\TrainerBookingRequestController;
use App\Http\Controllers\TrainerCalendarController;
use App\Http\Controllers\TrainerClientRecordsController;
use App\Http\Controllers\TrainerClientsController;
use App\Http\Controllers\TrainerDashboardController;
use App\Http\Controllers\TrainerGoogleCalendarController;
use App\Http\Controllers\TrainerGymsController;
use App\Http\Controllers\TrainerManualSessionController;
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
use App\Http\Controllers\TrainerSeriesController;
use App\Http\Controllers\TrainerServicesController;
use App\Http\Controllers\TrainerSessionChangeController;
use App\Http\Controllers\TrainerSettingsController;
use App\Http\Controllers\TrainerShareController;
use App\Http\Controllers\TrainerSocialController;
use App\Http\Controllers\WaitlistController;
use App\Models\User;
use App\Support\Seo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/', HomeController::class)->name('home');
// The app opened from the icon on the home screen (start_url of public/manifest.webmanifest).
Route::get('app', AppStartController::class)->name('pwa.start');
// For search engines, together with public/robots.txt.
Route::get('sitemap.xml', SitemapController::class)->name('sitemap');
Route::get('robots.txt', RobotsController::class)->name('robots');
// For AI assistants: what MioPersonal is and where its pages are (llmstxt.org).
Route::get('llms.txt', LlmsTxtController::class)->name('llms');
// IndexNow (Bing, Yandex…): the key file that proves the pings are ours (App\Support\IndexNow).
Route::get('{indexNowKey}.txt', IndexNowKeyController::class)->where('indexNowKey', '[A-Za-z0-9-]{8,128}')->name('indexnow.key');
// "Come funziona": what MioPersonal is, the page AI assistants and search engines can quote.
Route::get('come-funziona', HowItWorksController::class)->name('how-it-works');
// /personal-trainer = all of Italy, /personal-trainer/roma = one city (404 if unknown).
Route::get('personal-trainer/{city:slug?}', TrainerSearchController::class)->name('trainers.search');
// An old link (before the usernames) goes to the current one: see RedirectLegacySlug.
Route::get('trainer/{slug}', TrainerProfileController::class)->middleware('legacy-slug:trainer')->name('trainers.show');
// /palestre = all of Italy, /palestre/milano = one city (404 if unknown).
Route::get('palestre/{city:slug?}', GymSearchController::class)->name('gyms.search');
Route::get('palestra/{slug}', GymProfileController::class)->middleware('legacy-slug:gym')->name('gyms.show');
// /corsi = the courses of the gyms in all of Italy, /corsi/torino = one city (404 if unknown).
Route::get('corsi/{city:slug?}', CourseSearchController::class)->name('courses.search');
// "Prenota questo slot" for guests: login or sign-up, then back to the profile.
Route::get('trainer/{slug}/prenota', [BookingController::class, 'start'])->middleware(['auth', 'legacy-slug:trainer'])->name('trainers.book.start');
// "Novità": new trainers and gyms, in Italy or in a city (404 if unknown).
Route::get('novita/{city:slug?}', NewsController::class)->name('news');
// "Invita un amico": the link the booker shares; guests sign in, then come back.
Route::get('invito/{token}', [BookingInviteController::class, 'show'])->where('token', '[A-Za-z0-9]{32}')->name('bookings.invite');
Route::get('invito/{token}/accedi', [BookingInviteController::class, 'start'])->where('token', '[A-Za-z0-9]{32}')->middleware('auth')->name('bookings.invite.start');
// "Eventi": the next events of trainers and gyms, and the page of each one.
Route::get('eventi/{city:slug?}', EventSearchController::class)->name('events.search');
Route::get('evento/{slug}', [EventController::class, 'show'])->name('events.show');
Route::get('evento/{slug}/accedi', [EventController::class, 'start'])->middleware('auth')->name('events.start');

// Legal pages: drafts to be checked by a lawyer before the launch.
Route::inertia('privacy', 'public/privacy', [
    'seo' => Seo::page('Informativa privacy', 'Come MioPersonal tratta i dati personali di clienti e trainer: quali dati raccogliamo, perché, per quanto tempo e come esercitare i tuoi diritti.'),
])->name('legal.privacy');
Route::inertia('termini', 'public/terms', [
    'seo' => Seo::page('Termini e condizioni', "Le regole d'uso di MioPersonal per clienti e personal trainer: account, prenotazioni, cancellazioni, recensioni e responsabilità."),
])->name('legal.terms');
Route::inertia('cookie', 'public/cookies', [
    'seo' => Seo::page('Cookie policy', 'Quali cookie usa MioPersonal, a cosa servono e come cambiare in qualsiasi momento le tue preferenze.'),
])->name('legal.cookies');
// The choice of the cookie banner and of "Impostazioni cookie", also for guests.
Route::post('cookie/consenso', [CookieConsentController::class, 'store'])
    ->middleware('throttle:20,1')
    ->name('cookie-consent.store');

// "Continua con Google": see App\Http\Controllers\Auth\GoogleAuthController.
Route::middleware('guest')->controller(GoogleAuthController::class)->group(function () {
    Route::get('auth/google', 'redirect')->name('google.redirect');
    Route::get('registrazione/google', 'create')->name('google.register');
    Route::post('registrazione/google', 'store')->name('google.register.store');
});
// Email and phone checked while the sign-up forms are filled in (see the controller).
Route::post('registrazione/verifica', RegistrationCheckController::class)
    ->middleware(['guest', 'throttle:20,1'])
    ->name('register.check');
// The username: checked while typing (sign-up and "Scegli il tuo username"), and
// confirmed once by the accounts from before the usernames (EnsureUsernameChosen).
Route::post('username/verifica', [UsernameController::class, 'check'])
    ->middleware('throttle:30,1')
    ->name('username.check');
Route::middleware('auth')->controller(UsernameController::class)->group(function () {
    Route::get('scegli-username', 'show')->name('username.show');
    Route::post('scegli-username', 'store')->middleware('throttle:10,1')->name('username.store');
});

// Also for logged-in users: "Collega" in the settings comes back here (the address saved on Google).
Route::get('auth/google/callback', [GoogleAuthController::class, 'callback'])->name('google.callback');

// "Collega Instagram / TikTok / Facebook / YouTube" of the trainer profile: also
// for guests in "Diventa trainer" (see App\Http\Controllers\TrainerSocialController).
Route::controller(TrainerSocialController::class)->prefix('social/{provider}')->name('social.')->middleware('throttle:20,1')->group(function () {
    Route::get('collega', 'connect')->name('connect');
    Route::get('callback', 'callback')->name('callback');
    Route::delete('/', 'disconnect')->name('disconnect');
});

Route::get('contatti', [ContactController::class, 'show'])->name('contact.show');
Route::post('contatti', [ContactController::class, 'store'])
    ->middleware('throttle:contact')
    ->name('contact.store');

// Guests create a trainer account, logged-in clients turn theirs into a trainer one;
// the controller sends trainers and admins to their area. After sending, the same
// page shows "Profilo inviato".
Route::get('registrazione-trainer', [TrainerRegistrationController::class, 'show'])->name('trainer.register');
Route::post('registrazione-trainer', [TrainerRegistrationController::class, 'store'])->name('trainer.register.store');
// "Continua": checks the step being left (step 1 tells if an email is taken, hence the limit).
Route::post('registrazione-trainer/passo/{step}', [TrainerRegistrationController::class, 'check'])
    ->whereIn('step', ['1', '2', '3', '4', '5', '6'])
    ->middleware('throttle:20,1')
    ->name('trainer.register.check');

// "Registra la tua palestra": guests create a gym account (another email than
// their client or trainer one); a gym comes back to fix the profile when the
// team asks for changes.
Route::get('registrazione-palestra', [GymRegistrationController::class, 'show'])->name('gym.register');
Route::post('registrazione-palestra', [GymRegistrationController::class, 'store'])->name('gym.register.store');
// "Esci e registra la palestra": a client or trainer signs out to create the gym's own account.
Route::post('registrazione-palestra/esci', [GymRegistrationController::class, 'switchAccount'])->middleware('auth')->name('gym.register.switch');
Route::post('registrazione-palestra/passo/{step}', [GymRegistrationController::class, 'check'])
    ->whereIn('step', ['1', '2', '3', '4'])
    ->middleware('throttle:20,1')
    ->name('gym.register.check');

// "Attiva le notifiche" on this device: also before the email is verified
// ("Prenotazione inviata" offers it right after the first booking).
Route::middleware(['auth', 'throttle:20,1'])
    ->prefix('impostazioni/notifiche-push')
    ->name('account.push.')
    ->controller(PushSubscriptionController::class)
    ->group(function () {
        Route::post('/', 'store')->name('store');
        Route::delete('/', 'destroy')->name('destroy');
    });

// "Segnala" on profiles and reviews, for every logged-in user.
Route::post('segnalazioni', [ReportController::class, 'store'])
    ->middleware(['auth', 'throttle:10,1'])
    ->name('reports.store');

// The bell of the site: the latest notifications, and "segna tutte come lette".
Route::middleware(['auth', 'throttle:60,1'])
    ->prefix('notifiche')
    ->name('notifications.')
    ->controller(NotificationController::class)
    ->group(function () {
        Route::get('/', 'index')->name('index');
        Route::post('lette', 'markAllRead')->name('read');
    });

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
    // "Invita un amico": join with the link; the booker manages people, friends and link.
    Route::post('invito/{token}', [BookingInviteController::class, 'join'])
        ->where('token', '[A-Za-z0-9]{32}')
        ->middleware('throttle:10,1')
        ->name('bookings.invite.join');
    Route::controller(BookingInviteController::class)->prefix('prenotazioni/{booking}')->whereNumber('booking')->group(function () {
        Route::patch('persone', 'changePeople')->name('client.bookings.people');
        Route::post('invito', 'regenerate')->middleware('throttle:10,1')->name('client.bookings.invite.regenerate');
        Route::delete('ospiti/{guest}', 'removeGuest')->whereNumber('guest')->name('client.bookings.guests.destroy');
    });
    // The answer to the trainer's "Sposta": accept the new time, or keep the old one.
    Route::controller(ClientRescheduleController::class)->prefix('prenotazioni/{booking}/nuovo-orario')->whereNumber('booking')->group(function () {
        Route::post('/', 'accept')->name('client.bookings.reschedule.accept');
        Route::delete('/', 'decline')->name('client.bookings.reschedule.decline');
    });
    // The answer to a session the trainer put in the calendar ("Aggiungi seduta").
    Route::controller(ClientSessionProposalController::class)->prefix('prenotazioni/{booking}/proposta')->whereNumber('booking')->group(function () {
        Route::post('/', 'accept')->name('client.bookings.proposal.accept');
        Route::delete('/', 'decline')->name('client.bookings.proposal.decline');
    });

    // "Eventi": a place confirmed at once while there are places left, given back until the start.
    Route::post('evento/{slug}/iscrizione', [EventController::class, 'register'])->middleware('throttle:10,1')->name('events.register');
    Route::delete('evento/{slug}/iscrizione', [EventController::class, 'cancel'])->name('events.cancel');
    // "Avvisami se si libera": a full event, or a day a trainer is full.
    Route::controller(WaitlistController::class)->middleware('throttle:20,1')->group(function () {
        Route::post('evento/{slug}/lista-attesa', 'joinEvent')->name('events.waitlist.join');
        Route::delete('evento/{slug}/lista-attesa', 'leaveEvent')->name('events.waitlist.leave');
        Route::post('trainer/{slug}/lista-attesa', 'joinDay')->name('trainers.waitlist.join');
        Route::delete('trainer/{slug}/lista-attesa', 'leaveDay')->name('trainers.waitlist.leave');
    });

    // The heart on search cards and profiles: the gyms', then the trainers'.
    Route::post('preferiti/palestre/{slug}', [GymFavoriteController::class, 'store'])->name('client.favorites.gyms.store');
    Route::delete('preferiti/palestre/{slug}', [GymFavoriteController::class, 'destroy'])->name('client.favorites.gyms.destroy');
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
        // "Panoramica", the first page after the login.
        Route::get('area-cliente', ClientHomeController::class)->name('client.home');
        // "Le mie prenotazioni", also the address in the links already sent.
        Route::get('prenotazioni', ClientBookingsController::class)->name('client.bookings');
        // What the client writes in "Panoramica": trainings, weekly goal, weight.
        Route::controller(ClientProgressController::class)->middleware('throttle:30,1')->group(function () {
            Route::post('allenamenti', 'storeActivity')->name('client.activities.store');
            Route::delete('allenamenti/{log}', 'destroyActivity')->whereNumber('log')->name('client.activities.destroy');
            Route::put('obiettivo', 'updateGoal')->name('client.goal.update');
            Route::post('peso', 'storeWeight')->name('client.weight.store');
            Route::delete('peso/{measurement}', 'destroyWeight')->whereNumber('measurement')->name('client.weight.destroy');
        });
        // "Condividi i miei progressi con Marco".
        Route::patch('condivisione/{record}', [ClientSharingController::class, 'update'])
            ->whereNumber('record')
            ->middleware('throttle:30,1')
            ->name('client.sharing.update');
        // Public on the trainer's profile: only with a verified email.
        Route::post('prenotazioni/{booking}/recensione', [ClientReviewController::class, 'store'])
            ->whereNumber('booking')
            ->middleware('throttle:10,1')
            ->name('client.bookings.review');
        Route::get('preferiti', ClientFavoritesController::class)->name('client.favorites');
        // "Messaggi" with the client's trainers.
        Route::get('messaggi', [MessagesController::class, 'index'])->name('client.messages');
        // "Modifica profilo": the answers of "Completa il tuo profilo", inside the client area.
        Route::controller(CompleteProfileController::class)->group(function () {
            Route::get('profilo', 'edit')->name('client.profile');
            Route::put('profilo', 'update')->name('client.profile.update');
        });
        Route::get('impostazioni', [AccountSettingsController::class, 'show'])->name('account.settings');
    });

    // "Messaggi", for both sides of a trainer_clients record (checked in the controller).
    Route::controller(MessagesController::class)->prefix('messaggi/{record}')->whereNumber('record')->name('messages.')->group(function () {
        Route::get('nuovi', 'poll')->middleware('throttle:120,1')->name('poll');
        Route::get('precedenti', 'older')->middleware('throttle:60,1')->name('older');
        Route::post('/', 'store')->middleware('throttle:30,1')->name('store');
        Route::get('allegati/{message}', 'download')->whereNumber('message')->middleware('throttle:60,1')->name('download');
        // Many photos on one page: a higher limit.
        Route::get('foto/{message}', 'photo')->whereNumber('message')->middleware('throttle:300,1')->name('photo');
    });

    // Saved from both the client and the trainer settings page.
    Route::prefix('impostazioni')->name('account.')->controller(AccountSettingsController::class)->group(function () {
        Route::patch('dati-personali', 'updatePersonal')->name('personal.update');
        Route::put('password', 'updatePassword')->middleware('throttle:6,1')->name('password.update');
        Route::patch('notifiche', 'updateNotifications')->name('notifications.update');
    });
    // "Collega" / "Scollega" Google in "Accesso e sicurezza".
    Route::prefix('impostazioni/google')->name('account.google.')->controller(GoogleAuthController::class)->group(function () {
        Route::get('collega', 'link')->name('link');
        Route::delete('/', 'unlink')->name('unlink');
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
        // "Annulla seduta" and "Sposta" (a proposal the client accepts) of a confirmed session.
        Route::controller(TrainerSessionChangeController::class)->prefix('sedute/{booking}')->whereNumber('booking')->group(function () {
            Route::patch('annulla', 'cancel')->name('sessions.cancel');
            Route::post('sposta', 'propose')->name('sessions.reschedule');
            Route::delete('sposta', 'withdraw')->name('sessions.reschedule.withdraw');
        });
        Route::get('calendario', TrainerCalendarController::class)->name('calendar');
        // "Aggiungi seduta": with someone of the list, also without an account.
        Route::controller(TrainerManualSessionController::class)->group(function () {
            Route::post('calendario/sedute', 'store')->middleware('throttle:30,1')->name('calendar.sessions.store');
            Route::delete('calendario/sedute/{booking}', 'destroy')->whereNumber('booking')->name('calendar.sessions.destroy');
            Route::post('clienti/{client}/invito-nascosto', 'dismissInvitePrompt')->whereNumber('client')->name('clients.invite-prompt.dismiss');
        });
        // "Messaggi" with the clients who have an account.
        Route::get('messaggi', [MessagesController::class, 'index'])->name('messages');
        Route::get('clienti', TrainerClientsController::class)->name('clients');
        // What the trainer writes on their clients: new ones, private notes, payments.
        Route::controller(TrainerClientRecordsController::class)->prefix('clienti')->name('clients.')->group(function () {
            Route::post('/', 'store')->middleware('throttle:30,1')->name('store');
            Route::patch('{client}', 'update')->whereNumber('client')->name('update');
            Route::delete('{client}', 'destroy')->whereNumber('client')->name('destroy');
            Route::post('{client}/incassi', 'storePayment')->whereNumber('client')->name('payments.store');
            Route::delete('{client}/incassi/{payment}', 'destroyPayment')->whereNumber(['client', 'payment'])->name('payments.destroy');
        });
        // "Sedute fisse" (ogni martedì alle 18): made from the card of a client, ended from it.
        Route::controller(TrainerSeriesController::class)->prefix('clienti')->name('clients.series.')->group(function () {
            Route::post('{client}/sedute-fisse', 'store')->whereNumber('client')->middleware('throttle:20,1')->name('store');
            Route::post('sedute-fisse/{series}/termina', 'end')->whereNumber('series')->name('end');
        });
        Route::controller(TrainerAvailabilityController::class)->group(function () {
            Route::get('disponibilita', 'show')->name('availability');
            Route::put('disponibilita', 'update')->name('availability.update');
            // "Giorni e settimane diverse": a day, a week or the holidays.
            Route::post('disponibilita/eccezioni', 'storeOverride')->name('availability.overrides.store');
            Route::delete('disponibilita/eccezioni', 'destroyOverride')->name('availability.overrides.destroy');
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
        // "Palestre": the gyms where the trainer works; both sides must agree.
        Route::controller(TrainerGymsController::class)->prefix('palestre')->name('gyms')->group(function () {
            Route::get('/', 'show');
            Route::post('{slug}/richiesta', 'request')->middleware('throttle:20,1')->name('.request');
            Route::post('collegamenti/{link}/accetta', 'accept')->whereNumber('link')->name('.accept');
            Route::post('collegamenti/{link}/rifiuta', 'decline')->whereNumber('link')->name('.decline');
            Route::delete('collegamenti/{link}', 'destroy')->whereNumber('link')->name('.destroy');
        });
        Route::controller(OrganizerEventsController::class)->prefix('eventi')->name('events')->group(base_path('routes/organizer-events.php'));
        // "Condividi profilo": link, QR code and image for the Instagram stories.
        Route::get('condividi', TrainerShareController::class)->name('share');
        Route::get('impostazioni', TrainerSettingsController::class)->name('settings');
        // "Collega Google Calendar": the sessions are written on a calendar made for the app.
        Route::controller(TrainerGoogleCalendarController::class)->prefix('calendario-google')->name('google-calendar.')->group(function () {
            Route::get('collega', 'connect')->name('connect');
            Route::get('callback', 'callback')->name('callback');
            Route::delete('/', 'disconnect')->name('disconnect');
            // "Blocca gli orari occupati" off (on goes through "collega?occupato=1").
            Route::delete('occupato', 'disableBusy')->name('busy.disable');
        });
        Route::controller(TrainerProfileSettingsController::class)->group(function () {
            Route::patch('impostazioni/visibilita', 'updateVisibility')->name('visibility.update');
            Route::patch('impostazioni/contatti', 'updateContacts')->name('contacts.update');
            // "Chiudi il profilo": the account becomes a client one again.
            Route::delete('profilo', 'close')->name('profile.close');
        });
    });

    // The gym area: profile, photos, plans, promotions and trainers, all public right away.
    Route::middleware('role:gym')->prefix('area-palestra')->name('gym.')->group(function () {
        Route::get('/', GymDashboardController::class)->name('dashboard');
        Route::controller(GymProfileEditController::class)->group(function () {
            Route::get('profilo', 'show')->name('profile.edit');
            Route::put('profilo', 'update')->name('profile.update');
        });
        Route::controller(GymPhotoController::class)->prefix('foto')->name('photos')->group(function () {
            Route::get('/', 'show');
            Route::post('/', 'store')->name('.store');
            Route::post('{photo}/copertina', 'cover')->whereNumber('photo')->name('.cover');
            Route::delete('{photo}', 'destroy')->whereNumber('photo')->name('.destroy');
        });
        // "Servizi": description and photo of each ticked service.
        Route::controller(GymAmenitiesController::class)->prefix('servizi')->name('amenities')->group(function () {
            Route::get('/', 'show');
            Route::post('{amenity}', 'update')->name('.update');
            Route::delete('{amenity}/foto', 'destroyPhoto')->name('.photo.destroy');
        });
        // "Corsi": the courses and their weekly lessons; a lesson called off on one day.
        Route::controller(GymCoursesController::class)->prefix('corsi')->name('courses')->group(function () {
            Route::get('/', 'show');
            Route::post('/', 'store')->name('.store');
            Route::post('{course}', 'update')->whereNumber('course')->name('.update');
            Route::delete('{course}', 'destroy')->whereNumber('course')->name('.destroy');
            Route::post('lezioni/{lesson}/annulla', 'cancelLesson')->whereNumber('lesson')->name('.lessons.cancel');
            Route::delete('lezioni/{lesson}/annulla', 'restoreLesson')->whereNumber('lesson')->name('.lessons.restore');
            // "Foto" of a course: several, the first one on the cards.
            Route::post('{course}/foto', [GymCoursePhotoController::class, 'store'])->whereNumber('course')->name('.photos.store');
            Route::post('{course}/foto/{photo}/prima', [GymCoursePhotoController::class, 'first'])->whereNumber(['course', 'photo'])->name('.photos.first');
            Route::delete('{course}/foto/{photo}', [GymCoursePhotoController::class, 'destroy'])->whereNumber(['course', 'photo'])->name('.photos.destroy');
        });
        Route::controller(OrganizerEventsController::class)->prefix('eventi')->name('events')->group(base_path('routes/organizer-events.php'));
        Route::controller(GymPlansController::class)->group(function () {
            Route::get('abbonamenti', 'show')->name('plans');
            Route::put('abbonamenti', 'update')->name('plans.update');
        });
        Route::controller(GymPromotionsController::class)->prefix('promozioni')->name('promotions')->group(function () {
            Route::get('/', 'show');
            Route::post('/', 'store')->name('.store');
            Route::patch('{promotion}', 'update')->whereNumber('promotion')->name('.update');
            Route::delete('{promotion}', 'destroy')->whereNumber('promotion')->name('.destroy');
        });
        Route::controller(GymTrainersController::class)->prefix('trainer')->name('trainers')->group(function () {
            Route::get('/', 'show');
            Route::post('invito', 'invite')->middleware('throttle:20,1')->name('.invite');
            Route::post('{link}/accetta', 'accept')->whereNumber('link')->name('.accept');
            Route::post('{link}/rifiuta', 'decline')->whereNumber('link')->name('.decline');
            Route::delete('{link}', 'destroy')->whereNumber('link')->name('.destroy');
        });
        Route::controller(GymSettingsController::class)->group(function () {
            Route::get('impostazioni', 'show')->name('settings');
            Route::patch('impostazioni/visibilita', 'updateVisibility')->name('visibility.update');
        });
    });
});

// Only for the MioPersonal team: give access with `php artisan admin:grant {email}`.
// password.confirm: the password is asked again every 3 hours (auth.password_timeout),
// so a stolen session or "Ricordami" cookie alone doesn't open the admin area.
Route::middleware(['auth', 'verified', 'admin', 'password.confirm'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', AdminOverviewController::class)->name('overview');
    Route::get('statistiche', AdminStatsController::class)->name('stats');
    Route::get('verifica', AdminVerificationController::class)->name('verification');
    Route::post('verifica/{profile}/decisione', [AdminVerificationController::class, 'decide'])->name('verification.decide');
    // Certificates are private: only with the temporary link of the page.
    Route::get('verifica/attestati/{document}', [AdminVerificationController::class, 'certificate'])
        ->middleware('signed')
        ->name('verification.certificate');
    Route::get('verifica-palestre', AdminGymVerificationController::class)->name('gym-verification');
    Route::post('verifica-palestre/{gym}/decisione', [AdminGymVerificationController::class, 'decide'])->whereNumber('gym')->name('gym-verification.decide');
    Route::get('messaggi', AdminMessagesController::class)->name('messages');
    // "Segna come letto" / "Segna come da leggere".
    Route::post('messaggi/{message}/letto', [AdminMessagesController::class, 'markRead'])->whereNumber('message')->name('messages.read');
    Route::delete('messaggi/{message}/letto', [AdminMessagesController::class, 'markUnread'])->whereNumber('message')->name('messages.unread');
    Route::get('prenotazioni', AdminBookingsController::class)->name('bookings');
    Route::get('utenti', AdminUsersController::class)->name('users');
    Route::controller(AdminUserStatusController::class)->prefix('utenti/{user}')->whereNumber('user')->name('users.')->group(function () {
        Route::post('sospeso', 'suspend')->name('suspend');
        Route::delete('sospeso', 'reactivate')->name('reactivate');
        // Deleted for good 30 days later (users:purge-deleted).
        Route::post('cancellazione', 'scheduleDeletion')->name('deletion.schedule');
        Route::delete('cancellazione', 'cancelDeletion')->name('deletion.cancel');
        // "Chiudi il profilo" done by the team: the account stays, as a client.
        Route::delete('profilo-trainer', 'deleteTrainerProfile')->name('trainer-profile');
    });
    // "Segnalazioni": "Rimuovi" hides a review (profiles: the team acts from "Utenti"), "Ignora" closes it.
    Route::get('segnalazioni', AdminReportsController::class)->name('reports');
    Route::post('segnalazioni/{report}/esito', [AdminReportsController::class, 'resolve'])->whereNumber('report')->name('reports.resolve');
    Route::get('recensioni', AdminReviewsController::class)->name('reviews');
    // "Nascondi" / "Mostra di nuovo": off the trainer's profile and average, or back.
    Route::post('recensioni/{review}/nascosta', [AdminReviewsController::class, 'hide'])->whereNumber('review')->name('reviews.hide');
    Route::delete('recensioni/{review}/nascosta', [AdminReviewsController::class, 'show'])->whereNumber('review')->name('reviews.show');
    Route::get('eventi', AdminEventsController::class)->name('events');
    // "Nascondi" / "Mostra di nuovo": off the lists and its page, or back.
    Route::post('eventi/{event}/nascosto', [AdminEventsController::class, 'hide'])->whereNumber('event')->name('events.hide');
    Route::delete('eventi/{event}/nascosto', [AdminEventsController::class, 'show'])->whereNumber('event')->name('events.unhide');
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

// Unknown addresses: through the web middleware, so "Questa pagina non esiste (più)."
// knows who is logged in (header) and the Inertia version. Always the last route.
Route::fallback(fn () => abort(404));
