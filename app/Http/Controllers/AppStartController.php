<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Support\Stats;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * The `start_url` of public/manifest.webmanifest: the app opened from the
 * icon on the home screen. Counted for "Admin · Statistiche", then each user
 * goes to their area, guests to the home page.
 */
class AppStartController extends Controller
{
    public function __invoke(Request $request): RedirectResponse
    {
        Stats::recordAppOpen($request);

        /** @var User|null $user */
        $user = $request->user();

        return $user === null ? to_route('home') : to_route($user->role->homeRoute());
    }
}
