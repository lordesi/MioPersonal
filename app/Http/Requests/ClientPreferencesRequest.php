<?php

namespace App\Http\Requests;

use App\Enums\ActivityLevel;
use App\Enums\FitnessLevel;
use App\Enums\PreferredTime;
use App\Enums\Sex;
use App\Enums\TrainingExperience;
use App\Enums\TrainingGoal;
use App\Enums\TrainingMode;
use App\Models\City;
use App\Models\Discipline;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * "Salva e continua" of "Completa il tuo profilo". Everything is optional, but
 * only the values offered by the page are accepted. Height and weight only
 * with `body_data_consent` (GDPR art. 9); no other health data.
 */
class ClientPreferencesRequest extends FormRequest
{
    /** The budget slider, in cents: from 20 € to 100 € ("100 € o più"), steps of 5 €. */
    public const BUDGET_MIN_CENTS = 2000;

    public const BUDGET_MAX_CENTS = 10000;

    public const BUDGET_STEP_CENTS = 500;

    public const MIN_AGE = 18;

    public const MAX_AGE = 100;

    public const SESSIONS_PER_WEEK_MAX = 7;

    public const SPORTS_MAX = 8;

    public const SPORT_MAX_LENGTH = 40;

    public const TRAINER_NOTE_MAX_LENGTH = 500;

    public const HEIGHT_MIN_CM = 120;

    public const HEIGHT_MAX_CM = 230;

    public const WEIGHT_MIN_KG = 35;

    public const WEIGHT_MAX_KG = 250;

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
            // "Su di te": what the trainers the client books will read.
            'birth_year' => ['nullable', 'integer', 'min:'.self::oldestBirthYear(), 'max:'.self::youngestBirthYear()],
            'sex' => ['nullable', Rule::enum(Sex::class)],
            'fitness_level' => ['nullable', Rule::enum(FitnessLevel::class)],
            'training_experience' => ['nullable', Rule::enum(TrainingExperience::class)],
            'activity_level' => ['nullable', Rule::enum(ActivityLevel::class)],
            'sessions_per_week' => ['nullable', 'integer', 'min:1', 'max:'.self::SESSIONS_PER_WEEK_MAX],
            'sports' => ['array', 'max:'.self::SPORTS_MAX],
            'sports.*' => ['string', 'distinct:ignore_case', 'max:'.self::SPORT_MAX_LENGTH],
            'trainer_note' => ['nullable', 'string', 'max:'.self::TRAINER_NOTE_MAX_LENGTH],
            // Health-related (GDPR art. 9): accepted only with the separate consent.
            'body_data_consent' => ['boolean'],
            'height_cm' => ['nullable', 'integer', 'min:'.self::HEIGHT_MIN_CM, 'max:'.self::HEIGHT_MAX_CM, 'prohibited_unless:body_data_consent,true,1'],
            'weight_kg' => ['nullable', 'integer', 'min:'.self::WEIGHT_MIN_KG, 'max:'.self::WEIGHT_MAX_KG, 'prohibited_unless:body_data_consent,true,1'],
        ];
    }

    /** MioPersonal is for adults (see the terms): 18 this year at the latest. */
    public static function youngestBirthYear(): int
    {
        return (int) now()->year - self::MIN_AGE;
    }

    public static function oldestBirthYear(): int
    {
        return (int) now()->year - self::MAX_AGE;
    }

    /**
     * Before the rules: the sports trimmed, without the empty ones.
     */
    protected function prepareForValidation(): void
    {
        if (is_array($this->input('sports'))) {
            $this->merge([
                'sports' => array_values(array_filter(
                    array_map(fn (mixed $sport) => is_string($sport) ? Str::squish($sport) : $sport, $this->input('sports')),
                    // ConvertEmptyStringsToNull already turned '' into null.
                    fn (mixed $sport) => $sport !== '' && $sport !== null,
                )),
            ]);
        }

        if (is_string($this->input('trainer_note'))) {
            $this->merge(['trainer_note' => trim($this->input('trainer_note')) ?: null]);
        }
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
            'birth_year.*' => 'Scegli il tuo anno di nascita dall’elenco.',
            'sex.*' => 'Scegli una delle opzioni proposte.',
            'fitness_level.*' => 'Scegli il tuo livello tra quelli proposti.',
            'training_experience.*' => 'Scegli da quanto ti alleni tra le opzioni proposte.',
            'activity_level.*' => 'Scegli quanto ti muovi tra le opzioni proposte.',
            'sessions_per_week.*' => 'Scegli da 1 a 7 allenamenti a settimana.',
            'sports.max' => 'Puoi indicare al massimo '.self::SPORTS_MAX.' sport.',
            'sports.*.distinct' => 'Hai scritto lo stesso sport due volte.',
            'sports.*.*' => 'Ogni sport può avere al massimo '.self::SPORT_MAX_LENGTH.' caratteri.',
            'trainer_note.max' => 'La nota per il trainer può avere al massimo '.self::TRAINER_NOTE_MAX_LENGTH.' caratteri.',
            'height_cm.prohibited_unless' => 'Per salvare altezza e peso serve il tuo consenso.',
            'weight_kg.prohibited_unless' => 'Per salvare altezza e peso serve il tuo consenso.',
            'height_cm.*' => 'Scrivi l’altezza in centimetri, tra '.self::HEIGHT_MIN_CM.' e '.self::HEIGHT_MAX_CM.'.',
            'weight_kg.*' => 'Scrivi il peso in chili, tra '.self::WEIGHT_MIN_KG.' e '.self::WEIGHT_MAX_KG.'.',
        ];
    }
}
