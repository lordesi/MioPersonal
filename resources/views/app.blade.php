{{--
    Zoom: the public pages can be zoomed with two fingers, as every site; the
    private areas cannot, as the apps of the phone. Same rule as
    resources/js/lib/zoom-lock.ts (which also locks the installed app).
--}}
@php
    $zoomLocked = ! \Illuminate\Support\Str::startsWith($page['component'] ?? '', 'public/');
    // The photo of the trainer profile goes up under the clock of the phone
    // (EDGE_TO_EDGE in resources/js/lib/zoom-lock.ts).
    $edgeToEdge = in_array($page['component'] ?? '', ['public/profile'], true);
@endphp
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['zoom-locked' => $zoomLocked])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1{{ $zoomLocked ? ', maximum-scale=1, user-scalable=no' : '' }}{{ $edgeToEdge ? ', viewport-fit=cover' : '' }}">

        {{--
            The colour behind the page, before it is drawn (the areas have no SSR:
            opening the app or a push notification would show white until the
            JavaScript arrives). Dark like the site; the gym and admin areas are
            light. Same rule as resources/js/lib/page-background.ts.
            The body too: Safari on iOS 26 ignores theme-color and tints the bar
            at the top with the body's colour (white from bg-background, since
            .theme-dark is on an inner element). Outside @layer: it wins over it.
        --}}
        @php
            $pageBackground = \Illuminate\Support\Str::startsWith($page['component'] ?? '', ['gym/', 'admin/', 'dev/']) ? '#ffffff' : '#000000';
        @endphp
        <style>
            html, body {
                background-color: {{ $pageBackground }};
            }
        </style>

        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">
        {{-- The app on the home screen: public/manifest.webmanifest, public/sw.js. --}}
        <link rel="manifest" href="/manifest.webmanifest">
        <meta name="theme-color" content="{{ $pageBackground }}">
        <meta name="apple-mobile-web-app-title" content="MioPersonal">

        @include('partials.seo')

        @fonts

        @if (filled($cloudflareToken = config('services.cloudflare.analytics_token')))
            {{-- Visits, no cookies (App\Support\CloudflareAnalytics); "spa" counts the Inertia pages too. --}}
            <script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon="{{ json_encode(['token' => $cloudflareToken, 'spa' => true]) }}"></script>
        @endif

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        <x-inertia::head>
            {{-- Without the SSR server: the title of the `seo` prop, if any. --}}
            <title>{{ filled($page['props']['seo']['title'] ?? null) ? $page['props']['seo']['title'].' - '.config('app.name') : config('app.name', 'Laravel') }}</title>
        </x-inertia::head>
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />
        @if (\App\Support\Staging::active())
            {{-- The test copy: never mistaken for the real site. --}}
            <div style="position:fixed;bottom:8px;left:8px;z-index:2147483647;padding:4px 10px;border-radius:999px;background:#b45309;color:#fff;font:600 12px/1.4 system-ui,sans-serif;pointer-events:none">STAGING · dati finti</div>
        @endif
    </body>
</html>
