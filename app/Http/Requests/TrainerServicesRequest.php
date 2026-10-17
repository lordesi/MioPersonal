<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * "Servizi e prezzi" in the trainer area: the same services as step 4 of
 * "Diventa trainer", with the same checks and messages.
 */
class TrainerServicesRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return TrainerProfileRequest::servicesRules();
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return TrainerProfileRequest::servicesMessages();
    }

    /**
     * @return list<\Closure(Validator): void>
     */
    public function after(): array
    {
        return [
            fn (Validator $validator) => TrainerProfileRequest::checkSessions($validator, (array) $this->input('sessions', [])),
        ];
    }
}
