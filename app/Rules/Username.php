<?php

namespace App\Rules;

use App\Models\User;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Str;

/**
 * The username, chosen once at sign-up and never changed. It is unique on the
 * whole site; for trainers and gyms it is also the link of the public page
 * (/trainer/{username}, /palestra/{username}).
 *
 * The value must already be normalized (see normalize()): lowercase, no "@".
 */
class Username implements ValidationRule
{
    public const MIN = 3;

    public const MAX = 30;

    /**
     * Letters, numbers and "_ -" in the middle, never two in a row. No dots:
     * "/trainer/anna.css" would be taken for a file by the web server.
     */
    private const PATTERN = '/^(?!.*[_-]{2})[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?$/';

    /** Words that would look official or clash with a page of the site. */
    public const RESERVED = [
        'admin', 'administrator', 'amministratore', 'api', 'app', 'area-cliente', 'area-palestra', 'area-trainer',
        'assistenza', 'auth', 'blog', 'cliente', 'clienti', 'contatti', 'corsi', 'dashboard', 'eventi', 'evento',
        'help', 'info', 'login', 'logout', 'miopersonal', 'mio-personal', 'mio_personal', 'news', 'novita',
        'palestra', 'palestre', 'personal-trainer', 'prenota', 'privacy', 'profilo', 'registrazione', 'root',
        'staff', 'staging', 'support', 'supporto', 'team', 'termini', 'trainer', 'www',
    ];

    public function __construct(private ?int $ignoreUserId = null) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $username = (string) $value;

        if (strlen($username) < self::MIN || strlen($username) > self::MAX) {
            $fail('L\'username deve avere da '.self::MIN.' a '.self::MAX.' caratteri.');
        } elseif (preg_match(self::PATTERN, $username) !== 1) {
            $fail('Usa solo lettere minuscole, numeri, trattino o underscore (non all\'inizio o alla fine).');
        } elseif (in_array($username, self::RESERVED, true)) {
            $fail('Questo username non è disponibile, scegline un altro.');
        } elseif (self::taken($username, $this->ignoreUserId)) {
            $fail('Questo username è già preso.');
        }
    }

    /** " @Giulia_Fit " → "giulia_fit". */
    public static function normalize(?string $value): string
    {
        return Str::lower(ltrim(trim((string) $value), '@'));
    }

    /**
     * A free username from any text (a name, an old link), without the checks
     * of the form: "Giulia Rossi" → "giulia-rossi", then "giulia-rossi-2"…
     */
    public static function freeFrom(string $text): string
    {
        $base = trim(Str::limit(Str::slug($text), self::MAX - 4, ''), '-');

        if (strlen($base) < self::MIN) {
            $base = 'utente';
        }

        $username = $base;

        for ($number = 2; in_array($username, self::RESERVED, true) || self::taken($username); $number++) {
            $username = "{$base}-{$number}";
        }

        return $username;
    }

    public static function taken(string $username, ?int $exceptUserId = null): bool
    {
        return User::query()
            ->where('username', $username)
            ->when($exceptUserId !== null, fn ($query) => $query->whereKeyNot($exceptUserId))
            ->exists();
    }

    /** A free username from the name, to prefill the field: "giulia-rossi", then "giulia-rossi-2"… */
    public static function suggest(string $firstName, string $lastName = ''): string
    {
        return self::freeFrom(trim("{$firstName} {$lastName}"));
    }
}
