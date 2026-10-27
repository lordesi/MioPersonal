<?php

namespace App\Http\Requests\Settings;

use App\Concerns\PasswordValidationRules;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * "Elimina account": the user types ELIMINA. Who has a password types it too;
 * who signed up with Google and never set one can't, so it isn't asked.
 */
class ProfileDeleteRequest extends FormRequest
{
    use PasswordValidationRules;

    /** "elimina " is fine too: only the letters count. */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'confirmation' => mb_strtoupper(trim((string) $this->input('confirmation'))),
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var User $user */
        $user = $this->user();

        return [
            'confirmation' => ['required', 'in:ELIMINA'],
            ...($user->password !== null ? ['password' => $this->currentPasswordRules()] : []),
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'confirmation.required' => 'Scrivi ELIMINA per confermare.',
            'confirmation.in' => 'Scrivi ELIMINA per confermare.',
        ];
    }
}
