<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Str;

/**
 * "Continua" in "Registra la tua palestra": the rules and messages of
 * GymProfileRequest, only for the fields of the step being left. Nothing is saved.
 */
class GymRegistrationStepRequest extends GymProfileRequest
{
    /** The step of each field, as fieldSteps in components/onboarding/gym/draft.ts. The account (step 1) is the rest. */
    private const FIELD_STEPS = [
        'name' => 2,
        'city' => 2,
        'address' => 2,
        'postal_code' => 2,
        'description' => 2,
        'amenities' => 3,
        'hours' => 3,
        'opening_notes' => 3,
        'cover' => 4,
        'gallery' => 4,
        'contact_phone' => 5,
        'contact_email' => 5,
        'website' => 5,
        'instagram' => 5,
    ];

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $step = (int) $this->route('step');

        return array_filter(
            parent::rules(),
            fn (string $field) => (self::FIELD_STEPS[Str::before($field, '.')] ?? 1) === $step,
            ARRAY_FILTER_USE_KEY,
        );
    }
}
