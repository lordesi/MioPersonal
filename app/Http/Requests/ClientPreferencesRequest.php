<?php

namespace App\Http\Requests;

use App\Enums\PreferredTime;
use App\Enums\TrainingGoal;
use App\Enums\TrainingMode;
use App\Models\City;
use App\Models\Discipline;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * "Salva e continua" of "Completa il tuo profilo". Everything is optional, but
 * only the values offered by the page are accepted. No health data.
 */
class ClientPreferencesRequest extends FormRequest
{
    /** The budget slider, in cents: from 20 € to 100 € ("100 € o più"), steps of 5 €. */
    public const BUDGET_MIN_CENTS = 2000;

    public const BUDGET_MAX_CENTS = 10000;

    public const BUDGET_STEP_CENTS = 500;

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // Slugs, as in the select menus and chips of the page.
            'city' => ['nullable', 'string', Rule::exists(City::class, 'slug')->where('is_active', true)],
            'mode' => ['nullable', Rule::enum(TrainingMode::class)],
            'goal' => ['nullable', Rule::enum(TrainingGoal::class)],
            'disciplines' => ['array'],
            'disciplines.*' => ['string', 'distinct', Rule::exists(Discipline::class, 'slug')->where('is_active', true)],
            'times' => ['array'],
            'times.*' => [Rule::enum(PreferredTime::class), 'distinct'],
            'budget_max_cents' => [
                'nullable',
                'integer',
                'min:'.self::BUDGET_MIN_CENTS,
                'max:'.self::BUDGET_MAX_CENTS,
                'multiple_of:'.self::BUDGET_STEP_CENTS,
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'city.exists' => 'La città scelta non è disponibile.',
            'mode.*' => 'Scegli come preferisci allenarti tra le opzioni proposte.',
            'goal.*' => 'Scegli il tuo obiettivo tra quelli proposti.',
            'disciplines.*.*' => 'Una delle discipline scelte non è più disponibile.',
            'times.*.*' => 'Scegli gli orari tra quelli proposti.',
            'budget_max_cents.*' => 'Scegli un budget tra 20 e 100 €.',
        ];
    }
}
