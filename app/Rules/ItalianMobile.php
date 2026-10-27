<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * An Italian mobile that looks real: without an SMS we can't be sure it
 * exists, but we refuse what can't be one (9999999999, 3333333333…).
 * Spaces are ignored; the format (10 digits) is checked by phoneNumberRules().
 */
class ItalianMobile implements ValidationRule
{
    /**
     * The first three digits: the mobile prefixes given to the operators
     * (313 and 319 for a few special networks, then 320-399).
     */
    private const PREFIX = '/^3(1[39]|[2-9][0-9])[0-9]{7}$/';

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $number = str_replace(' ', '', (string) $value);

        if (preg_match(self::PREFIX, $number) !== 1 || self::looksFake(substr($number, 3))) {
            $fail('Inserisci un numero di cellulare reale, es. 347 521 8846.');
        }
    }

    /**
     * The 7 digits after the prefix: all the same ("0000000") or in a row,
     * up or down ("1234567", "7654321", "8901234").
     */
    private static function looksFake(string $digits): bool
    {
        $steps = [];

        for ($i = 1; $i < strlen($digits); $i++) {
            // 9 → 0 counts as +1, 0 → 9 as -1.
            $steps[] = ((int) $digits[$i] - (int) $digits[$i - 1] + 10) % 10;
        }

        $steps = array_unique($steps);

        return count($steps) === 1 && in_array($steps[0], [0, 1, 9], true);
    }
}
