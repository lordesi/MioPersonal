<?php

use App\Http\Controllers\Settings\AccountDeletionController;
use App\Http\Controllers\Settings\ProfileController;
use Illuminate\Support\Facades\Route;

// "Elimina account" of "Impostazioni account" (client and trainer): the
// account settings pages themselves are in routes/web.php.
Route::middleware(['auth', 'verified'])->group(function () {
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// "Account in eliminazione": the only page left until the deletion, with
// "Annulla eliminazione" (EnsureAccountActive sends here).
Route::middleware('auth')->controller(AccountDeletionController::class)->group(function () {
    Route::get('account/eliminazione', 'show')->name('account.deletion');
    Route::delete('account/eliminazione', 'cancel')->name('account.deletion.cancel');
});
