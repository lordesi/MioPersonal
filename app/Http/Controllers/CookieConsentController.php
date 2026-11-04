<?php

namespace App\Http\Controllers;

use App\Http\Requests\CookieConsentRequest;
use App\Models\CookieConsent;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;

/**
 * "Accetta tutti", "Rifiuta tutti" and "Salva preferenze" of the cookie
 * banner: the choice is saved as proof and in the browser's cookie.
 */
class CookieConsentController extends Controller
{
    public function store(CookieConsentRequest $request): RedirectResponse
    {
        $choice = [
            'analytics' => $request->boolean('analytics'),
            'marketing' => $request->boolean('marketing'),
        ];

        // The same browser keeps its id, so its choices can be read together.
        $consentId = CookieConsent::fromCookie($request)['id'] ?? (string) Str::uuid();

        CookieConsent::create([
            'consent_id' => $consentId,
            'user_id' => $request->user()?->id,
            'policy_version' => CookieConsent::POLICY_VERSION,
            ...$choice,
        ]);

        $cookie = cookie(
            CookieConsent::COOKIE,
            (string) json_encode(['id' => $consentId, 'version' => CookieConsent::POLICY_VERSION, ...$choice]),
            CookieConsent::COOKIE_MINUTES,
        );

        return back()->withCookie($cookie);
    }
}
