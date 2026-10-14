<?php

namespace App\Http\Requests\Account;

use App\Concerns\PasswordValidationRules;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

/**
 * "Cambia password" in Impostazioni account: the current password is always
 * asked, except to who signed up with Google and never had one ("Imposta una
 * password"). The design has no "repeat password" field (like the sign-up), so
 * no `confirmed` rule.
 */
class PasswordUpdateRequest extends FormRequest
{
    use PasswordValidationRules;

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var User $user */
        $user = $this->user();

        return [
            ...($user->password !== null ? ['current_password' => $this->currentPasswordRules()] : []),
            'password' => ['required', 'string', Password::default()],
        ];
    }
}
