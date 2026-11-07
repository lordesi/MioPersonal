{{-- The end of "Collega Instagram / TikTok / ..." in the popup (TrainerSocialController): tells the page that opened it and closes. --}}
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex">
    <title>MioPersonal</title>
    <style>
        body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: system-ui, sans-serif; background: #fff; color: #111; text-align: center; padding: 24px; box-sizing: border-box; }
        a { color: inherit; font-weight: 600; }
        @media (prefers-color-scheme: dark) { body { background: #111; color: #f5f5f5; } }
    </style>
</head>
<body>
    <main>
        <p>{{ $message }}</p>
        <p><a href="{{ route('trainer.register') }}" id="back">Torna a MioPersonal</a></p>
    </main>
    <script>
        (function () {
            var payload = {{ Illuminate\Support\Js::from($payload) }};
            if (window.opener && !window.opener.closed) {
                window.opener.postMessage(payload, window.location.origin);
                window.close();
            }
        })();
    </script>
</body>
</html>
