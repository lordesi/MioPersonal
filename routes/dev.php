<?php

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
});
