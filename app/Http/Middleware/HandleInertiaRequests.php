<?php

namespace App\Http\Middleware;

use App\Enums\TrainerProfileStatus;
use App\Enums\UserRole;
use App\Models\CookieConsent;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Pages rendered in the browser only: server-side rendering (resources/js/ssr.tsx)
     * is for what search engines read, the public pages. The private areas and the
     * account forms skip it, so they don't load the Node server.
     *
     * @var array<int, string>
     */
    protected $withoutSsr = [
        'area-cliente*',
        'area-trainer*',
        'admin*',
        'dashboard',
        'impostazioni*',
        'profilo',
        'preferiti',
        'prenotazioni*',
        'completa-profilo',
        'registrazione/*',
        'trainer/*/prenota',
        'login',
        'register',
        'forgot-password',
        'reset-password/*',
        'email/*',
        'user/*',
        'settings*',
        'dev/*',
        'account/*',
    ];

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                // Only what the pages use (types/auth.ts): not the whole model, which
                // also holds the phone, acquisition data and the activity times.
                'user' => $request->user()?->only(['id', 'name', 'email', 'avatar', 'email_verified_at', 'role']),
                // The number on "Preferiti" in the account menu (the same trainers as the page).
                'favoritesCount' => fn () => $request->user()?->role === UserRole::Client
                    ? $request->user()->favoriteTrainers()->where('trainer_profiles.status', TrainerProfileStatus::Approved)->count()
                    : null,
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            // null shows the cookie banner.
            'cookieConsent' => CookieConsent::current($request),
        ];
    }
}
