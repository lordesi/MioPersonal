<?php

namespace App\Http\Requests;

use App\Actions\Fortify\CreateNewUser;
use App\Enums\GymAmenity;
use App\Enums\UserRole;
use App\Models\City;
use App\Models\GymProfile;
use App\Rules\Username;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * "Registra la tua palestra" (steps 2–5) and "Modifica profilo" of the gym
 * area: the gym, services and hours, photos, public contacts. A guest also
 * sends the account (step 1); a gym fixing or editing its profile only the
 * profile.
 *
 * Hours: hours[0..6] (0 = Monday) = list of {opens, closes} in "HH:MM",
 * every 30 minutes; "24:00" closes at midnight.
 */
class GymProfileRequest extends FormRequest
{
    public const DESCRIPTION_MIN = 60;

    public const DESCRIPTION_MAX = 1500;

    /** Opening ranges in a day ("9–13 e 15–21"). */
    public const MAX_RANGES_PER_DAY = 3;

    /** Gallery photos sent with the registration; more from "Foto" later. */
    public const MAX_REGISTRATION_PHOTOS = 6;

    private const TIME = '/^(([01]\d|2[0-3]):(00|30)|24:00)$/';

    /**
     * "Instagram": "@fitlab", "instagram.com/fitlab/" or the full link all become
     * "fitlab"; a website without "https://" gets it.
     */
    protected function prepareForValidation(): void
    {
        $changes = [];

        // The account of a guest: "@FitLab" is "fitlab".
        if ($this->has('username')) {
            $changes['username'] = Username::normalize($this->input('username'));
        }

        if ($this->has('instagram')) {
            $value = trim((string) $this->input('instagram'));
            $value = (string) preg_replace('~^(https?://)?(www\.)?instagr(am\.com|\.am)/~i', '', $value);
            $value = trim(explode('?', $value)[0], "/@ \t");
            $changes['instagram'] = $value === '' ? null : $value;
        }

        if ($this->has('website')) {
            $value = trim((string) $this->input('website'));
            $changes['website'] = match (true) {
                $value === '' => null,
                preg_match('~^https?://~i', $value) === 1 => $value,
                default => "https://{$value}",
            };
        }

        if ($this->has('contact_email')) {
            $value = trim((string) $this->input('contact_email'));
            $changes['contact_email'] = $value === '' ? null : mb_strtolower($value);
        }

        $this->merge($changes);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            ...$this->accountRules(),

            // Step 2: the gym.
            'name' => ['required', 'string', 'max:120'],
            'city' => ['required', 'string', Rule::exists(City::class, 'slug')->where('is_active', true)],
            'address' => ['required', 'string', 'max:200'],
            'postal_code' => ['nullable', 'string', 'regex:/^\d{5}$/'],
            'description' => ['required', 'string', 'min:'.self::DESCRIPTION_MIN, 'max:'.self::DESCRIPTION_MAX],

            // Step 3: services and hours.
            'amenities' => ['required', 'array', 'min:1'],
            'amenities.*' => [Rule::enum(GymAmenity::class), 'distinct'],
            'hours' => ['array:0,1,2,3,4,5,6'],
            'hours.*' => ['array', 'max:'.self::MAX_RANGES_PER_DAY],
            'hours.*.*.opens' => ['required', 'string', 'regex:'.self::TIME],
            'hours.*.*.closes' => ['required', 'string', 'regex:'.self::TIME],
            'opening_notes' => ['nullable', 'string', 'max:200'],

            // Step 4: photos. The cover is required, except for a profile that already has one.
            'cover' => [Rule::requiredIf(fn () => $this->currentProfile()?->cover === null), 'nullable', 'image', 'mimes:jpg,jpeg,png', 'max:5120', 'dimensions:min_width=800,min_height=500'],
            'gallery' => ['array', 'max:'.self::MAX_REGISTRATION_PHOTOS],
            'gallery.*' => ['image', 'mimes:jpg,jpeg,png', 'max:5120', 'dimensions:min_width=800,min_height=500'],

            // Step 5: public contacts.
            'contact_phone' => ['nullable', 'string', 'max:30', 'regex:/^[0-9 +().\/-]{6,30}$/'],
            'contact_email' => ['nullable', 'string', 'email', 'max:150'],
            'website' => ['nullable', 'string', 'max:200', 'url:http,https'],
            'instagram' => ['nullable', 'string', 'regex:/^[A-Za-z0-9._]{1,30}$/'],
        ];
    }

    /**
     * @return list<\Closure(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                if (! isset($this->rules()['hours'])) {
                    return;
                }

                foreach ((array) $this->input('hours', []) as $day => $ranges) {
                    if (! is_array($ranges)) {
                        continue;
                    }

                    $previousEnd = null;

                    foreach (array_values($ranges) as $range) {
                        $opens = is_array($range) ? (string) ($range['opens'] ?? '') : '';
                        $closes = is_array($range) ? (string) ($range['closes'] ?? '') : '';

                        if ($opens >= $closes) {
                            $validator->errors()->add("hours.{$day}", 'In ogni fascia l’apertura deve venire prima della chiusura.');

                            break;
                        }

                        if ($previousEnd !== null && $opens < $previousEnd) {
                            $validator->errors()->add("hours.{$day}", 'Le fasce di uno stesso giorno non possono sovrapporsi.');

                            break;
                        }

                        $previousEnd = $closes;
                    }
                }
            },
        ];
    }

    /** The gym's profile when it already exists (fixing or editing). */
    private function currentProfile(): ?GymProfile
    {
        return $this->user()?->role === UserRole::Gym ? $this->user()->gymProfile : null;
    }

    /**
     * A guest creates the account too.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    private function accountRules(): array
    {
        return $this->user() === null ? app(CreateNewUser::class)->rules() : [];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Scrivi il nome della palestra.',
            'name.max' => 'Il nome può avere al massimo 120 caratteri.',
            'city.required' => 'Scegli la città della palestra.',
            'city.exists' => 'La città scelta non è disponibile.',
            'address.required' => 'Scrivi l’indirizzo della palestra.',
            'address.max' => 'L’indirizzo è troppo lungo.',
            'postal_code.regex' => 'Il CAP ha 5 cifre, es. 20121.',
            'description.required' => 'Descrivi la palestra.',
            'description.min' => 'La descrizione deve avere almeno '.self::DESCRIPTION_MIN.' caratteri.',
            'description.max' => 'La descrizione può avere al massimo '.self::DESCRIPTION_MAX.' caratteri.',
            'amenities.required' => 'Scegli almeno un servizio.',
            'amenities.min' => 'Scegli almeno un servizio.',
            'amenities.*.*' => 'Scegli i servizi tra quelli proposti.',
            'hours.*' => 'Controlla gli orari di apertura.',
            'hours.*.max' => 'Al massimo '.self::MAX_RANGES_PER_DAY.' fasce per giorno.',
            'hours.*.*.*' => 'Controlla gli orari: ogni 30 minuti, dalle 00:00 alle 24:00.',
            'opening_notes.max' => 'Le note sugli orari possono avere al massimo 200 caratteri.',
            'cover.required' => 'Carica la foto di copertina.',
            'cover.image' => 'La copertina deve essere un’immagine JPG o PNG.',
            'cover.mimes' => 'La copertina deve essere un’immagine JPG o PNG.',
            'cover.max' => 'La copertina può pesare al massimo 5 MB.',
            'cover.dimensions' => 'La copertina deve essere almeno 800 × 500 px.',
            'cover.uploaded' => 'Non siamo riusciti a caricare la copertina: riprova.',
            'gallery.max' => 'Puoi caricare al massimo '.self::MAX_REGISTRATION_PHOTOS.' foto adesso: le altre dopo, da “Foto”.',
            'gallery.*.image' => 'Le foto devono essere immagini JPG o PNG.',
            'gallery.*.mimes' => 'Le foto devono essere immagini JPG o PNG.',
            'gallery.*.max' => 'Ogni foto può pesare al massimo 5 MB.',
            'gallery.*.dimensions' => 'Ogni foto deve essere almeno 800 × 500 px.',
            'gallery.*.uploaded' => 'Non siamo riusciti a caricare una foto: riprova.',
            'contact_phone.*' => 'Scrivi un numero di telefono valido.',
            'contact_email.*' => 'Scrivi un indirizzo email valido.',
            'website.*' => 'Scrivi l’indirizzo del sito, es. www.fitlab.it.',
            'instagram.*' => 'Scrivi il nome del profilo Instagram, es. fitlab.milano.',
        ];
    }
}
