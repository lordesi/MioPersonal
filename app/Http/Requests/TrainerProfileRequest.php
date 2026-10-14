<?php

namespace App\Http\Requests;

use App\Actions\Fortify\CreateNewUser;
use App\Enums\PlaceType;
use App\Enums\TrainerExperience;
use App\Enums\UserRole;
use App\Models\City;
use App\Models\Discipline;
use App\Models\TrainerProfile;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * Steps 2–7 of "Diventa trainer": public profile, disciplines and places,
 * services, hours and rules, certifications. A guest also sends the account
 * (step 1), a client only the trainer terms: everything is checked at once,
 * so the page can show every error.
 */
class TrainerProfileRequest extends FormRequest
{
    /** The options of step 5, as in step-hours.tsx. */
    public const RULE_OPTIONS = [
        'notice_hours' => [2, 6, 12, 24, 48],
        'booking_window_days' => [14, 30, 60, 90],
        'break_minutes' => [0, 15, 30],
        'free_cancellation_hours' => [12, 24, 48],
    ];

    /** "Massimo sedute al giorno"; null = "Nessun limite". */
    public const MAX_SESSIONS_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 10];

    /** Step 3: studios and cities besides the main one. */
    public const MAX_STUDIOS = 3;

    public const MAX_OTHER_CITIES = 2;

    /** Step 6: certifications are optional, at most 3. */
    public const MAX_CERTIFICATIONS = 3;

    /** Step 4: hourly prices (1 – 1.000 €) and packages (up to 10.000 €), in cents. */
    public const MAX_HOURLY_CENTS = 100000;

    public const MAX_PACKAGE_CENTS = 1000000;

    public const MAX_PACKAGES = 3;

    public const NOTE_MAX = 200;

    /** First and last start hour of the hours grid: from 6:00 to 24:00. */
    public const FIRST_HOUR = 6;

    public const LAST_HOUR = 23;

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            ...$this->accountRules(),

            // Step 2
            'headline' => ['required', 'string', 'max:60'],
            'bio' => ['required', 'string', 'min:150', 'max:800'],
            'experience' => ['required', Rule::enum(TrainerExperience::class)],
            // Required, except for a profile that already has one (fixing after "Chiedi modifiche").
            'photo' => [Rule::requiredIf(fn () => $this->user()?->trainerProfile?->portrait === null), 'nullable', 'image', 'mimes:jpg,jpeg,png', 'max:5120', 'dimensions:min_width=400,min_height=400'],

            // Step 3
            'disciplines' => ['required', 'array', 'min:1', 'max:'.TrainerProfile::MAX_DISCIPLINES],
            'disciplines.*' => ['string', 'distinct', Rule::exists(Discipline::class, 'slug')->where('is_active', true)],
            'places' => ['required', 'array', 'min:1'],
            'places.*' => [Rule::enum(PlaceType::class), 'distinct'],
            'studios' => ['array', 'max:'.self::MAX_STUDIOS],
            'studios.*.name' => ['required', 'string', 'max:100'],
            'studios.*.address' => ['required', 'string', 'max:200'],
            'city' => ['nullable', 'string', Rule::exists(City::class, 'slug')->where('is_active', true)],
            'other_cities' => ['array', 'max:'.self::MAX_OTHER_CITIES],
            'other_cities.*' => ['string', 'distinct', Rule::exists(City::class, 'slug')->where('is_active', true)],

            // Step 4: "Seduta singola" at an hourly price, online at its own
            // price (optional), a first session (optional, can be free), packages.
            'hourly_price_cents' => ['required', 'integer', 'min:100', 'max:'.self::MAX_HOURLY_CENTS],
            'single_note' => ['nullable', 'string', 'max:'.self::NOTE_MAX],
            'online_price_cents' => ['nullable', 'integer', 'min:100', 'max:'.self::MAX_HOURLY_CENTS],
            'online_note' => ['nullable', 'string', 'max:'.self::NOTE_MAX],
            'first_session' => ['nullable', 'array'],
            'first_session.name' => ['required_with:first_session', 'string', 'max:100'],
            'first_session.minutes' => ['required_with:first_session', 'integer', Rule::in(TrainerProfile::SESSION_MINUTES)],
            'first_session.price_cents' => ['required_with:first_session', 'integer', 'min:0', 'max:'.self::MAX_HOURLY_CENTS],
            'first_session.note' => ['nullable', 'string', 'max:'.self::NOTE_MAX],
            'packages' => ['array', 'max:'.self::MAX_PACKAGES],
            'packages.*.sessions' => ['required', 'integer', 'between:2,50'],
            'packages.*.minutes' => ['required', 'integer', Rule::in(TrainerProfile::SESSION_MINUTES)],
            'packages.*.price_cents' => ['required', 'integer', 'min:100', 'max:'.self::MAX_PACKAGE_CENTS],
            'packages.*.note' => ['nullable', 'string', 'max:'.self::NOTE_MAX],

            // Step 5: hours by day, 0 = Monday … 6 = Sunday.
            'hours' => ['array:0,1,2,3,4,5,6'],
            'hours.*' => ['array'],
            'hours.*.*' => ['integer', 'between:'.self::FIRST_HOUR.','.self::LAST_HOUR],
            ...array_map(fn (array $options) => ['required', 'integer', Rule::in($options)], self::RULE_OPTIONS),
            'max_sessions_per_day' => ['nullable', 'integer', Rule::in(self::MAX_SESSIONS_OPTIONS)],
            'session_minutes' => ['required', 'array', 'min:1'],
            'session_minutes.*' => ['integer', 'distinct', Rule::in(TrainerProfile::SESSION_MINUTES)],
            'auto_confirm' => ['required', 'boolean'],

            // Step 6: id = a certification already sent, to keep its file.
            'certifications' => ['array', 'max:'.self::MAX_CERTIFICATIONS],
            'certifications.*.id' => ['nullable', 'integer'],
            'certifications.*.title' => ['required', 'string', 'max:150'],
            'certifications.*.issuer' => ['nullable', 'string', 'max:150'],
            'certifications.*.year' => ['nullable', 'integer', 'between:1950,'.now()->year],
            'certifications.*.file' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
        ];
    }

    /**
     * A guest creates the account too; a client accepts the trainer terms;
     * a trainer who fixes the profile sends only the profile.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    private function accountRules(): array
    {
        $user = $this->user();

        return match ($user?->role) {
            null => app(CreateNewUser::class)->rules(),
            UserRole::Client => ['terms' => ['accepted']],
            default => [],
        };
    }

    /**
     * @return list<\Closure(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                $places = (array) $this->input('places', []);

                if (in_array(PlaceType::Studio->value, $places, true) && $this->input('studios', []) === []) {
                    $validator->errors()->add('studios', 'Aggiungi almeno uno studio con nome e indirizzo.');
                }

                // Online-only trainers don't need a city.
                if (array_diff($places, [PlaceType::Online->value]) !== [] && ! $this->filled('city')) {
                    $validator->errors()->add('city', 'Scegli la tua città principale.');
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
            'headline.required' => 'Scrivi il titolo del profilo.',
            'headline.max' => 'Il titolo può avere al massimo 60 caratteri.',
            'bio.required' => 'Scrivi chi sei e come lavori.',
            'bio.min' => 'La presentazione deve avere almeno 150 caratteri.',
            'bio.max' => 'La presentazione può avere al massimo 800 caratteri.',
            'experience.*' => 'Scegli gli anni di esperienza.',
            'photo.required' => 'Carica una foto del profilo.',
            'photo.image' => 'La foto deve essere un’immagine JPG o PNG.',
            'photo.mimes' => 'La foto deve essere un’immagine JPG o PNG.',
            'photo.max' => 'La foto può pesare al massimo 5 MB.',
            'photo.dimensions' => 'La foto deve essere almeno 400 × 400 px.',
            'photo.uploaded' => 'Non siamo riusciti a caricare la foto: riprova.',
            'disciplines.required' => 'Scegli almeno una disciplina.',
            'disciplines.min' => 'Scegli almeno una disciplina.',
            'disciplines.max' => 'Puoi scegliere al massimo 5 discipline.',
            'disciplines.*.*' => 'Una delle discipline scelte non è più disponibile.',
            'places.required' => 'Scegli almeno un luogo in cui alleni.',
            'places.min' => 'Scegli almeno un luogo in cui alleni.',
            'places.*.*' => 'Scegli i luoghi tra quelli proposti.',
            'studios.max' => 'Puoi indicare al massimo 3 luoghi in presenza.',
            'studios.*.name.required' => 'Scrivi il nome di ogni studio.',
            'studios.*.address.required' => 'Scrivi l’indirizzo di ogni studio.',
            'studios.*.*.max' => 'Il nome o l’indirizzo di uno studio è troppo lungo.',
            'city.exists' => 'La città scelta non è disponibile.',
            'other_cities.max' => 'Puoi aggiungere al massimo 2 altre città.',
            'other_cities.*.*' => 'Una delle altre città non è disponibile.',
            'hourly_price_cents.required' => 'Indica il tuo prezzo all’ora.',
            'hourly_price_cents.integer' => 'Indica il prezzo all’ora in euro.',
            'hourly_price_cents.min' => 'Il prezzo all’ora deve essere almeno 1 €.',
            'hourly_price_cents.max' => 'Il prezzo all’ora può essere al massimo 1.000 €.',
            'online_price_cents.*' => 'Il prezzo online all’ora deve essere tra 1 e 1.000 €.',
            'first_session.name.*' => 'Scrivi il nome della prima seduta (massimo 100 caratteri).',
            'first_session.minutes.*' => 'Scegli la durata della prima seduta.',
            'first_session.price_cents.*' => 'Il prezzo della prima seduta deve essere tra 0 (gratis) e 1.000 €.',
            'packages.max' => 'Puoi aggiungere al massimo 3 pacchetti.',
            'packages.*.sessions.*' => 'Un pacchetto deve avere da 2 a 50 sedute.',
            'packages.*.minutes.*' => 'Scegli la durata delle sedute del pacchetto.',
            'packages.*.price_cents.*' => 'Il prezzo di un pacchetto deve essere tra 1 e 10.000 €.',
            'single_note.max' => 'Le note possono avere al massimo 200 caratteri.',
            'online_note.max' => 'Le note possono avere al massimo 200 caratteri.',
            'first_session.note.max' => 'Le note possono avere al massimo 200 caratteri.',
            'packages.*.note.max' => 'Le note possono avere al massimo 200 caratteri.',
            'hours.*' => 'Controlla gli orari: si può iniziare dalle 6 alle 23.',
            'hours.*.*' => 'Controlla gli orari: si può iniziare dalle 6 alle 23.',
            'hours.*.*.*' => 'Controlla gli orari: si può iniziare dalle 6 alle 23.',
            'notice_hours.*' => 'Scegli il preavviso minimo tra le opzioni.',
            'booking_window_days.*' => 'Scegli fino a quando si può prenotare.',
            'break_minutes.*' => 'Scegli la pausa tra due sedute.',
            'max_sessions_per_day.*' => 'Scegli il massimo di sedute al giorno.',
            'free_cancellation_hours.*' => 'Scegli fino a quando si può cancellare.',
            'session_minutes.required' => 'Scegli almeno una durata prenotabile.',
            'session_minutes.min' => 'Scegli almeno una durata prenotabile.',
            'session_minutes.*' => 'Scegli le durate tra quelle proposte.',
            'session_minutes.*.*' => 'Scegli le durate tra quelle proposte.',
            'certifications.max' => 'Puoi aggiungere al massimo 3 certificazioni.',
            'certifications.*.title.required' => 'Ogni certificazione deve avere un titolo.',
            'certifications.*.title.max' => 'Il titolo di una certificazione è troppo lungo.',
            'certifications.*.issuer.max' => 'Il nome di un ente è troppo lungo.',
            'certifications.*.year.*' => 'Scrivi l’anno con 4 cifre, es. 2020.',
            'certifications.*.file.mimes' => 'Gli attestati devono essere PDF, JPG o PNG.',
            'certifications.*.file.max' => 'Ogni attestato può pesare al massimo 10 MB.',
            'certifications.*.file.uploaded' => 'Non siamo riusciti a caricare un attestato: riprova.',
        ];
    }
}
