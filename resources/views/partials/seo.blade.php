{{--
    What search engines and social networks read: the `seo` prop of the page
    (see App\Support\Seo). Written by Laravel, so it is there with or without
    the SSR server. Pages without it (private areas, forms) are not indexed.
--}}
@php
    $seo = $page['props']['seo'] ?? null;
@endphp
@if (is_array($seo))
    @php
        $canonical = $seo['canonical'] ?? url()->current();
        // public/images/og-default.png: 1200×630, the size social networks show large.
        $image = $seo['image'] ?? asset('images/og-default.png');
        $fullTitle = $seo['title'] === '' ? config('app.name') : $seo['title'].' - '.config('app.name');
    @endphp
    <meta name="description" content="{{ $seo['description'] }}">
    <meta name="robots" content="{{ $seo['index'] ? 'index, follow, max-image-preview:large' : 'noindex, follow' }}">
    @if ($seo['index'])
        <link rel="canonical" href="{{ $canonical }}">
    @endif
    <meta property="og:site_name" content="{{ config('app.name') }}">
    <meta property="og:locale" content="it_IT">
    <meta property="og:type" content="{{ $seo['type'] }}">
    <meta property="og:title" content="{{ $fullTitle }}">
    <meta property="og:description" content="{{ $seo['description'] }}">
    <meta property="og:url" content="{{ $canonical }}">
    <meta property="og:image" content="{{ $image }}">
    @if (! $seo['image'])
        <meta property="og:image:width" content="1200">
        <meta property="og:image:height" content="630">
    @endif
    {{-- A trainer's photo is square: the small card fits it better. --}}
    <meta name="twitter:card" content="{{ $seo['image'] ? 'summary' : 'summary_large_image' }}">
    @if ($seo['jsonLd'] !== [])
        <script type="application/ld+json">{!! \App\Support\Seo::jsonLd($seo['jsonLd']) !!}</script>
    @endif
@else
    <meta name="robots" content="noindex, follow">
@endif
