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
            'phone' => self::phoneWithPrefix($input['phone_prefix'] ?? null, $input['phone'] ?? null),
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
            // Two boxes: "+39" and "333 000 0000", saved together in `phone`.
            'phone_prefix' => $this->phonePrefixRules(),
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

    /** "+39" and "333 000 0000" → "+393330000000"; no number → null. */
    public static function phoneWithPrefix(?string $prefix, ?string $number): ?string
    {
        $number = self::normalizePhone($number);

        return $number === null ? null : trim((string) $prefix).$number;
    }

    /** "+39 333 000 0000" → "+393330000000"; empty → null. */
    public static function normalizePhone(?string $phone): ?string
    {
        $phone = str_replace(' ', '', trim((string) $phone));

        return $phone === '' ? null : $phone;
    }
}
