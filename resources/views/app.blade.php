<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: #ffffff;
            }
        </style>

        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">
        {{-- The app on the home screen: public/manifest.webmanifest, public/sw.js. --}}
        <link rel="manifest" href="/manifest.webmanifest">
        <meta name="theme-color" content="#ffffff">
        <meta name="apple-mobile-web-app-title" content="MioPersonal">

        @include('partials.seo')

        @fonts

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
