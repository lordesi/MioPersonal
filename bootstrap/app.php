<?php

use App\Http\Middleware\EnsureAccountActive;
use App\Http\Middleware\EnsureUserHasRole;
use App\Http\Middleware\EnsureUserIsAdmin;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\SecurityHeaders;
use App\Http\Middleware\ThrottleSignups;
use App\Http\Middleware\TrackLastActivity;
use App\Http\Middleware\TrackVisit;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['sidebar_state']);

        // Only requests for APP_URL (and its subdomains); off in local and in tests.
        $middleware->trustHosts();

        $middleware->alias([
            'admin' => EnsureUserIsAdmin::class,
            'role' => EnsureUserHasRole::class,
        ]);

        $middleware->web(append: [
            HandleInertiaRequests::class,
            // After Inertia: its redirects become 303 for PUT/PATCH/DELETE.
            EnsureAccountActive::class,
            AddLinkHeadersForPreloadedAssets::class,
            TrackLastActivity::class,
            TrackVisit::class,
            ThrottleSignups::class,
        ]);
        // First, so its headers are on every response of the group (429s included).
        $middleware->web(prepend: [SecurityHeaders::class]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $wantsJson = fn (Request $request) => $request->is('api/*') || $request->expectsJson();

        $exceptions->shouldRenderJsonWhen($wantsJson);

        // Our own pages instead of Laravel's English ones: "Questa pagina non esiste (più)."
        // for 404, public/error for the others. With APP_DEBUG a 500 keeps Laravel's
        // page, which shows what went wrong.
        $exceptions->respond(function (Response $response, Throwable $exception, Request $request) use ($wantsJson) {
            $status = $response->getStatusCode();

            if ($wantsJson($request)) {
                return $response;
            }

            // An address with no route for that method (e.g. GET settings/profile, which
            // only deletes; or a PATCH that the GET-only fallback route catches): for
            // the visitor it's a page that doesn't exist.
            if ($status === 405) {
                $status = 404;
            }

            if (! in_array($status, [403, 404, 419, 429, 500, 503], true)) {
                return $response;
            }

            if ($status === 500 && config('app.debug')) {
                return $response;
            }

            $page = $status === 404
                ? Inertia::render('public/not-found')
                : Inertia::render('public/error', ['status' => $status]);

            return $page->toResponse($request)->setStatusCode($status);
        });
    })->create();
