<?php

namespace App\Rules;

use App\Support\WorkingRanges;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * One range of the working hours of a day: {start, end} in minutes, from
 * 06:00 to 24:00 on the half hour (WorkingRanges). A whole start hour of the
 * old format (18) is still accepted, for a page opened before the change.
 */
class WorkingRange implements ValidationRule
{
    public const MESSAGE = 'Controlla gli orari: le fasce vanno dalle 06:00 alle 24:00, a mezz’ore.';

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! WorkingRanges::isValid($value)) {
            $fail(self::MESSAGE);
        }
    }
}
