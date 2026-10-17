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
     * Italian mobile without the prefix (always +39): exactly 10 digits,
     * single spaces allowed (e.g. 333 000 0000). Required: the trainer calls
     * the client after confirming a booking.
     *
     * @return array<int, ValidationRule|array<mixed>|string>
     */
    protected function phoneNumberRules(): array
    {
        return ['required', 'string', 'regex:/^[0-9]( ?[0-9]){9}$/'];
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
