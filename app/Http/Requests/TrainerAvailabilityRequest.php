<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * "Disponibilità" in the trainer area: the same hours and rules as step 5
 * of "Diventa trainer", with the same checks and messages.
 */
class TrainerAvailabilityRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            ...TrainerProfileRequest::availabilityRules(),
            // The page always sends the 7 days, even when they are all empty.
            'hours' => ['present', 'array:0,1,2,3,4,5,6'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return TrainerProfileRequest::availabilityMessages();
    }
}
