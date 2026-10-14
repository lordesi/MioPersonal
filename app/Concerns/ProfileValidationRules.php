<?php

namespace App\Concerns;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rule;

trait ProfileValidationRules
{
    /**
     * Get the validation rules used to validate user profiles.
     *
     * @return array<string, array<int, ValidationRule|array<mixed>|string>>
     */
    protected function profileRules(?int $userId = null): array
    {
        return [
            'name' => $this->nameRules(),
            'email' => $this->emailRules($userId),
        ];
    }

    /**
     * Get the validation rules used to validate user names.
     *
     * @return array<int, ValidationRule|array<mixed>|string>
     */
    protected function nameRules(): array
    {
        return ['required', 'string', 'max:255'];
    }

    /**
     * Required phone: digits and spaces, with an optional "+" (e.g. +39 333 000 0000).
     * The trainer sees it only after confirming a booking.
     *
     * @return array<int, ValidationRule|array<mixed>|string>
     */
    protected function phoneRules(): array
    {
        return ['required', 'string', 'max:20', 'regex:/^\+?[0-9 ]{6,19}$/'];
    }

    /**
     * Sign-up: the "Prefisso" box, e.g. +39.
     *
     * @return array<int, ValidationRule|array<mixed>|string>
     */
    protected function phonePrefixRules(): array
    {
        return ['required', 'string', 'regex:/^\+[0-9]{1,4}$/'];
    }

    /**
     * Sign-up: the number without the prefix, 6–12 digits, single spaces allowed
     * (e.g. 333 000 0000). Required.
     *
     * @return array<int, ValidationRule|array<mixed>|string>
     */
    protected function phoneNumberRules(): array
    {
        return ['required', 'string', 'regex:/^[0-9]( ?[0-9]){5,11}$/'];
    }

    /**
     * Get the validation rules used to validate user emails.
     *
     * @return array<int, ValidationRule|array<mixed>|string>
     */
    protected function emailRules(?int $userId = null): array
    {
        return [
            'required',
            'string',
            // rfc + PHP's filter: "nome@esempio" (no dot in the domain) is refused.
            'email:rfc,filter',
            'max:255',
            $userId === null
                ? Rule::unique(User::class)
                : Rule::unique(User::class)->ignore($userId),
        ];
    }
}
