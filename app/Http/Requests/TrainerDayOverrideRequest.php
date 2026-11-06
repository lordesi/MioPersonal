<?php

namespace App\Http\Requests;

use App\Support\TrainerSlots;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * "Giorni e settimane diverse" of "Disponibilità": a day, a week or a period
 * (the holidays), closed or with other hours. `hours` has the 7 days of the
 * week, as the weekly grid: each date takes the hours of its weekday.
 */
class TrainerDayOverrideRequest extends FormRequest
{
    /** Longest period saved at once: about three months. */
    public const MAX_DAYS = 92;

    public const NOTE_MAX = 60;

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $today = CarbonImmutable::now(TrainerSlots::TIMEZONE)->toDateString();

        return [
            'from' => ['required', 'date_format:Y-m-d', 'after_or_equal:'.$today],
            'to' => ['required', 'date_format:Y-m-d', 'after_or_equal:from'],
            'closed' => ['required', 'boolean'],
            'hours' => ['exclude_if:closed,true', 'required', 'array:0,1,2,3,4,5,6'],
            'hours.*' => ['array'],
            'hours.*.*' => ['integer', 'between:'.TrainerProfileRequest::FIRST_HOUR.','.TrainerProfileRequest::LAST_HOUR],
            'note' => ['nullable', 'string', 'max:'.self::NOTE_MAX],
        ];
    }

    /**
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }

                $from = CarbonImmutable::parse($this->string('from')->value());
                $to = CarbonImmutable::parse($this->string('to')->value());

                if ($from->diffInDays($to) >= self::MAX_DAYS) {
                    $validator->errors()->add('to', 'Puoi modificare al massimo '.self::MAX_DAYS.' giorni alla volta.');
                }
            },
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'from.after_or_equal' => 'Scegli un giorno da oggi in poi.',
            'from.*' => 'Scegli il giorno da cui partire.',
            'to.after_or_equal' => 'La fine non può venire prima dell’inizio.',
            'to.*' => 'Scegli l’ultimo giorno.',
            'hours.*' => 'Controlla gli orari: si può iniziare dalle 6 alle 23.',
            'hours.*.*' => 'Controlla gli orari: si può iniziare dalle 6 alle 23.',
            'hours.*.*.*' => 'Controlla gli orari: si può iniziare dalle 6 alle 23.',
            'note.max' => 'La nota può avere al massimo '.self::NOTE_MAX.' caratteri.',
        ];
    }
}
