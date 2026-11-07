<?php

namespace App\Http\Controllers;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

/**
 * "Attiva le notifiche" / "Disattiva" (resources/js/lib/push.ts): the device's
 * subscription from the browser's push service, one per browser.
 */
class PushSubscriptionController extends Controller
{
    /**
     * The push services of the browsers. The server sends a request to the
     * endpoint: only these hosts, so nobody can make it call another address.
     */
    private const PUSH_HOSTS = [
        'fcm.googleapis.com',               // Chrome, Edge on Android, Samsung Internet, Opera
        'updates.push.services.mozilla.com', // Firefox
        '.push.apple.com',                  // Safari, apps added to the iPhone home screen
        '.notify.windows.com',              // Edge on Windows
    ];

    public function store(Request $request): Response
    {
        $data = $request->validate([
            'endpoint' => ['required', 'string', 'max:1024', 'url:https', $this->knownPushService()],
            'keys.p256dh' => ['required', 'string', 'max:255'],
            'keys.auth' => ['required', 'string', 'max:255'],
            'content_encoding' => ['nullable', Rule::in(['aesgcm', 'aes128gcm'])],
        ]);

        /** @var User $user */
        $user = $request->user();
        $user->updatePushSubscription(
            $data['endpoint'],
            $data['keys']['p256dh'],
            $data['keys']['auth'],
            $data['content_encoding'] ?? 'aes128gcm',
        );

        return response()->noContent();
    }

    /** "Disattiva" on this device; the other devices keep theirs. */
    public function destroy(Request $request): Response
    {
        $data = $request->validate(['endpoint' => ['required', 'string', 'max:1024']]);

        /** @var User $user */
        $user = $request->user();
        $user->deletePushSubscription($data['endpoint']);

        return response()->noContent();
    }

    private function knownPushService(): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail) {
            $host = mb_strtolower((string) parse_url((string) $value, PHP_URL_HOST));

            $known = collect(self::PUSH_HOSTS)->contains(
                fn (string $push) => str_starts_with($push, '.') ? str_ends_with($host, $push) : $host === $push,
            );

            if (! $known) {
                $fail('Questo browser non è supportato per le notifiche.');
            }
        };
    }
}
