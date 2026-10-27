<?php

namespace App\Concerns;

use App\Actions\Fortify\CreateNewUser;
use App\Models\User;
use App\Rules\ItalianMobile;
use Closure;
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
     * single spaces allowed (e.g. 347 521 8846), that looks real and that no
     * other account has. Required: the trainer calls the client after
     * confirming a booking. Pass the user's id when they change their own number.
     *
     * @return array<int, ValidationRule|Closure|string>
     */
    protected function phoneNumberRules(?int $userId = null): array
    {
        return [
            // Stop at the first error: one message, and no query for a wrong number.
            'bail',
            'required',
            'string',
            'regex:/^[0-9]( ?[0-9]){9}$/',
            new ItalianMobile,
            function (string $attribute, mixed $value, Closure $fail) use ($userId): void {
                if (CreateNewUser::phoneInUse((string) $value, $userId)) {
                    $fail('Esiste già un account con questo numero.');
                }
            },
        ];
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
