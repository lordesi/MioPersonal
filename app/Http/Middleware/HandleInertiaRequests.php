<?php

namespace App\Http\Middleware;

use App\Enums\TrainerProfileStatus;
use App\Enums\UserRole;
use App\Models\CookieConsent;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Sentry\State\Scope;

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
        'area-palestra*',
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
     * Tells Sentry who hit the error: only the id and the role, never name or email.
     */
    public function handle(Request $request, \Closure $next)
    {
        $user = $request->user();

        if ($user !== null && class_exists(Scope::class)) {
            \Sentry\configureScope(function (Scope $scope) use ($user): void {
                $scope->setUser(['id' => (string) $user->getKey()]);
                $scope->setTag('role', $user->role->value);
            });
        }

        return parent::handle($request, $next);
    }

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
                'user' => $request->user()?->only(['id', 'name', 'username', 'email', 'avatar', 'email_verified_at', 'role']),
                // The number on the bell (components/layout/notification-bell.tsx).
                'unreadNotifications' => fn () => $request->user()?->unreadNotifications()->count() ?? 0,
                // The number on "Preferiti" in the account menu (the same trainers and gyms as the page).
                'favoritesCount' => fn () => ($counts = $this->favoriteCounts($request)) === null ? null : $counts['trainers'] + $counts['gyms'],
                // The numbers on the "Preferiti" filter of the two searches.
                'favoriteCounts' => fn () => $this->favoriteCounts($request),
            ],
            // For "Attiva le notifiche" (lib/push.ts); null hides it (no keys in the .env).
            'vapidPublicKey' => fn () => $request->user() === null ? null : (config('webpush.vapid.public_key') ?: null),
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            // null shows the cookie banner.
            'cookieConsent' => CookieConsent::current($request),
        ];
    }

    /**
     * The saved trainers and gyms still public; null for guests and the other roles.
     * Counted once per request (kept on the request): both props read it.
     *
     * @return array{trainers: int, gyms: int}|null
     */
    private function favoriteCounts(Request $request): ?array
    {
        /** @var User|null $user */
        $user = $request->user();

        if ($user?->role !== UserRole::Client) {
            return null;
        }

        /** @var array{trainers: int, gyms: int} */
        return $request->attributes->get('favoriteCounts') ?? tap([
            'trainers' => $user->favoriteTrainers()->where('trainer_profiles.status', TrainerProfileStatus::Approved)->count(),
            'gyms' => $user->favoriteGyms()->approved()->count(),
        ], fn (array $counts) => $request->attributes->set('favoriteCounts', $counts));
    }
}
