<?php

use Illuminate\Support\Facades\Route;

/*
 * "Eventi" of the trainer area and of the gym area (OrganizerEventsController):
 * loaded in both groups of routes/web.php, named trainer.events.* and gym.events.*.
 */

Route::get('/', 'index');
Route::get('nuovo', 'create')->name('.create');
Route::post('/', 'store')->middleware('throttle:20,1')->name('.store');
Route::post('inviti/{host}/accetta', 'accept')->whereNumber('host')->name('.invites.accept');
Route::post('inviti/{host}/rifiuta', 'decline')->whereNumber('host')->name('.invites.decline');
Route::get('{session}', 'show')->whereNumber('session')->name('.show');
Route::get('{session}/modifica', 'edit')->whereNumber('session')->name('.edit');
// A POST, not a PUT: the form may send a photo.
Route::post('{session}', 'update')->whereNumber('session')->name('.update');
Route::post('{session}/annulla', 'cancel')->whereNumber('session')->name('.cancel');
Route::delete('{session}', 'destroy')->whereNumber('session')->name('.destroy');
Route::put('{session}/posti', 'seats')->whereNumber('session')->name('.seats');
Route::delete('{session}/iscritti/{registration}', 'removeRegistration')
    ->whereNumber(['session', 'registration'])
    ->name('.registrations.destroy');
Route::post('{session}/organizzatori', 'invite')->whereNumber('session')->middleware('throttle:20,1')->name('.hosts.store');
Route::delete('{session}/organizzatori/{host}', 'removeHost')->whereNumber(['session', 'host'])->name('.hosts.destroy');
