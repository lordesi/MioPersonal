<?php

namespace App\Actions\Fortify;

use App\Concerns\ProfileValidationRules;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use ProfileValidationRules;

    /** Italian numbers only, for now. */
    public const PHONE_PREFIX = '+39';

    /**
     * Validate and create a newly registered user (client or trainer).
     * The role is set by whoever calls this (clients are the default).
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        // "Mario@Esempio.it " and "mario@esempio.it" are the same account.
        $input['email'] = self::normalizeEmail($input['email'] ?? null);

        Validator::make($input, $this->rules())->validate();

        return User::create([
            'first_name' => trim($input['first_name']),
            'last_name' => trim($input['last_name']),
            'email' => $input['email'],
            'phone' => self::italianPhone($input['phone'] ?? null),
            'password' => $input['password'],
            // When the consent was given, as the GDPR asks.
            'terms_accepted_at' => now(),
        ]);
    }

    /**
     * The sign-up fields. The trainer registration checks them together with the profile.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => $this->emailRules(),
            // Only the number ("333 000 0000"): the prefix is always +39.
            'phone' => $this->phoneNumberRules(),
            // The design has no "repeat password" field: the show/hide button replaces it.
            'password' => ['required', 'string', Password::default()],
            'terms' => ['accepted'],
        ];
    }

    public static function normalizeEmail(?string $email): string
    {
        return Str::lower(trim((string) $email));
    }

    /**
     * "333 000 0000" → "+393330000000"; no number → null. The prefix can't be
     * changed: whatever the browser sends, it is always +39.
     */
    public static function italianPhone(?string $number): ?string
    {
        $number = self::normalizePhone($number);

        return $number === null ? null : self::PHONE_PREFIX.$number;
    }

    /** "333 000 0000" → "3330000000"; empty → null. */
    public static function normalizePhone(?string $phone): ?string
    {
        $phone = str_replace(' ', '', trim((string) $phone));

        return $phone === '' ? null : $phone;
    }
}
