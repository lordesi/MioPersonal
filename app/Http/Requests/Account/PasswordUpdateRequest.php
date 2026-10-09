<?php

namespace App\Http\Requests\Account;

use App\Concerns\PasswordValidationRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

/**
 * "Cambia password" in Impostazioni account.
 * The design has no "repeat password" field (like the sign-up), so no `confirmed` rule.
 */
class PasswordUpdateRequest extends FormRequest
{
    use PasswordValidationRules;

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'current_password' => $this->currentPasswordRules(),
            'password' => ['required', 'string', Password::default()],
        ];
    }
}
