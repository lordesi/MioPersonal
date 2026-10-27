<?php

namespace App\Http\Requests\Account;

use App\Concerns\ProfileValidationRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/** "Dati personali" in Impostazioni account: same limits as the sign-up. */
class PersonalDataUpdateRequest extends FormRequest
{
    use ProfileValidationRules;

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            // The user's own number doesn't count as "already used".
            'phone' => $this->phoneNumberRules($this->user()?->id),
        ];
    }
}
