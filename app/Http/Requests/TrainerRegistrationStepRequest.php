<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Str;

/**
 * "Continua" in "Diventa trainer": the rules and messages of
 * TrainerProfileRequest, only for the fields of the step being left, so its
 * errors show up there and not after "Invia per approvazione". Nothing is saved.
 */
class TrainerRegistrationStepRequest extends TrainerProfileRequest
{
    /** The step of each field, as fieldSteps in draft.ts. The account (step 1) is the rest. */
    private const FIELD_STEPS = [
        'headline' => 2,
        'bio' => 2,
        'experience' => 2,
        'photo' => 2,
        'disciplines' => 3,
        'goals' => 3,
        'places' => 3,
        'studios' => 3,
        'city' => 3,
        'other_cities' => 3,
        'sessions' => 4,
        'first_session' => 4,
        'packages' => 4,
        'hours' => 5,
        'notice_hours' => 5,
        'booking_window_days' => 5,
        'break_minutes' => 5,
        'max_sessions_per_day' => 5,
        'free_cancellation_hours' => 5,
        'auto_confirm' => 5,
        'certifications' => 6,
    ];

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $step = (int) $this->route('step');

        // "sessions.*.name" belongs to the step of "sessions".
        return array_filter(
            parent::rules(),
            fn (string $field) => (self::FIELD_STEPS[Str::before($field, '.')] ?? 1) === $step,
            ARRAY_FILTER_USE_KEY,
        );
    }
}
