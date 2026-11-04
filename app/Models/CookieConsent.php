<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Http\Request;

/**
 * A choice made on the cookie banner or in "Impostazioni cookie": the proof
 * of the consent asked by the Garante. The same choice lives in the browser,
 * in the `mp_cookie_consent` cookie, and decides if the banner is shown.
 *
 * @property int $id
 * @property string $consent_id
 * @property int|null $user_id
 * @property string $policy_version
 * @property bool $analytics
 * @property bool $marketing
 * @property CarbonImmutable|null $created_at
 * @property-read User|null $user
 */
#[Fillable(['consent_id', 'user_id', 'policy_version', 'analytics', 'marketing'])]
class CookieConsent extends Model
{
    public const UPDATED_AT = null;

    public const COOKIE = 'mp_cookie_consent';

    /** Raise it when the cookie policy changes: the banner comes back for everyone. */
    public const POLICY_VERSION = '2026-10';

    /** The Garante asks not to show the banner again for 6 months. */
    public const COOKIE_MINUTES = 60 * 24 * 182;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'analytics' => 'boolean',
            'marketing' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * What the browser's cookie says, whatever the policy version.
     *
     * @return array{id: string, version: string, analytics: bool, marketing: bool}|null
     */
    public static function fromCookie(Request $request): ?array
    {
        $raw = $request->cookie(self::COOKIE);
        $value = is_string($raw) ? json_decode($raw, true) : null;

        if (! is_array($value) || ! is_string($value['id'] ?? null) || ! is_string($value['version'] ?? null)) {
            return null;
        }

        return [
            'id' => $value['id'],
            'version' => $value['version'],
            'analytics' => ($value['analytics'] ?? false) === true,
            'marketing' => ($value['marketing'] ?? false) === true,
        ];
    }

    /**
     * The choices for the current policy, or null to show the banner.
     *
     * @return array{analytics: bool, marketing: bool}|null
     */
    public static function current(Request $request): ?array
    {
        $consent = self::fromCookie($request);

        if ($consent === null || $consent['version'] !== self::POLICY_VERSION) {
            return null;
        }

        return ['analytics' => $consent['analytics'], 'marketing' => $consent['marketing']];
    }
}
