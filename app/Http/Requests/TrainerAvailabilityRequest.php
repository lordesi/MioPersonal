<?php

namespace App\Http\Requests;

use App\Rules\WorkingRange;
use App\Support\TrainerSlots;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * "Disponibilità" in the trainer area: the same hours and rules as step 5
 * of "Diventa trainer", with the same checks and messages, and the days
 * changed in "Per settimana" and "Ferie e chiusure" (TrainerDayOverrides).
 */
class TrainerAvailabilityRequest extends FormRequest
{
    /** Days changed in one save: the holidays of a year are far fewer. */
    public const MAX_DAYS = 400;

    /** "Ferie", "Gara": under the days in "Ferie e chiusure". */
    public const NOTE_MAX = 60;

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $today = CarbonImmutable::now(TrainerSlots::TIMEZONE);
        $from = $today->toDateString();
        $until = $today->addYear()->toDateString();

        return [
            ...TrainerProfileRequest::availabilityRules(),
            // The page always sends the 7 days, even when they are all empty.
            'hours' => ['present', 'array:0,1,2,3,4,5,6'],
            // Days with their own ranges ([] = closed), from today to a year.
            'days' => ['sometimes', 'array', 'max:'.self::MAX_DAYS],
            'days.*' => ['array:date,hours,note'],
            'days.*.date' => ['required', 'date_format:Y-m-d', 'after_or_equal:'.$from, 'before_or_equal:'.$until, 'distinct'],
            'days.*.hours' => ['present', 'array'],
            'days.*.hours.*' => [new WorkingRange],
            'days.*.note' => ['nullable', 'string', 'max:'.self::NOTE_MAX],
            // Days back to the weekly hours.
            'reset' => ['sometimes', 'array', 'max:'.self::MAX_DAYS],
            'reset.*' => ['date_format:Y-m-d'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            ...TrainerProfileRequest::availabilityMessages(),
            'days.max' => 'Puoi cambiare al massimo '.self::MAX_DAYS.' giorni alla volta.',
            'days.*.date.after_or_equal' => 'Non puoi cambiare i giorni già passati.',
            'days.*.date.before_or_equal' => 'Puoi cambiare i giorni fino a un anno da oggi.',
            'days.*.date.*' => 'Controlla i giorni scelti.',
            'days.*.hours.*' => WorkingRange::MESSAGE,
            'days.*.note.max' => 'La nota può avere al massimo '.self::NOTE_MAX.' caratteri.',
            'reset.*' => 'Controlla i giorni scelti.',
        ];
    }
}
