<?php

namespace App\Http\Requests;

use App\Actions\GroupSessions\SaveGroupSession;
use App\Enums\GroupSessionPlace;
use App\Enums\GroupSessionType;
use App\Models\City;
use App\Models\Discipline;
use App\Models\GroupSession;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * "Nuovo evento" / "Modifica evento" of the organizer area. The price comes
 * in euros ("12,50"), it goes on in cents (price_cents).
 */
class GroupSessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * The gyms an event can take place in: the gym itself, or the gyms where
     * the trainer works.
     *
     * @return list<int>
     */
    public static function gymIds(User $user): array
    {
        if ($user->gymProfile !== null) {
            return [$user->gymProfile->id];
        }

        return array_values(array_map(intval(...), $user->trainerProfile?->gyms()->approved()->pluck('gym_profiles.id')->all() ?? []));
    }

    protected function prepareForValidation(): void
    {
        $price = str_replace(',', '.', trim((string) $this->input('price', '0')));

        $this->merge([
            'price_cents' => is_numeric($price) ? (int) round((float) $price * 100) : $price,
        ]);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var User $user */
        $user = $this->user();
        $place = $this->input('place');

        return [
            'type' => ['required', Rule::in(array_map(fn (GroupSessionType $type) => $type->value, GroupSessionType::choosable()))],
            'title' => ['required', 'string', 'max:'.GroupSession::TITLE_MAX],
            'description' => ['nullable', 'string', 'max:'.GroupSession::DESCRIPTION_MAX],
            'discipline_id' => ['nullable', 'integer', Rule::exists(Discipline::class, 'id')->where('is_active', true)],
            'place' => ['required', Rule::enum(GroupSessionPlace::class)],
            'gym_profile_id' => [Rule::requiredIf($place === GroupSessionPlace::Gym->value), 'nullable', 'integer', Rule::in(self::gymIds($user))],
            'address' => [Rule::requiredIf($place === GroupSessionPlace::Address->value), 'nullable', 'string', 'max:160'],
            'city_id' => [Rule::requiredIf($place === GroupSessionPlace::Address->value), 'nullable', 'integer', Rule::exists(City::class, 'id')->where('is_active', true)],
            'date' => ['required', 'date_format:Y-m-d'],
            'start' => ['required', 'date_format:H:i'],
            'end' => ['required', 'date_format:H:i'],
            'capacity' => ['required', 'integer', 'between:1,'.GroupSession::MAX_CAPACITY],
            'price_cents' => ['required', 'integer', 'between:0,1000000'],
            'dates' => ['nullable', 'integer', 'between:1,'.GroupSession::MAX_DATES],
            'scope' => ['nullable', Rule::in([SaveGroupSession::SCOPE_THIS, SaveGroupSession::SCOPE_FOLLOWING])],
            'cover' => ['nullable', 'image', 'mimes:jpg,jpeg,png', 'max:5120', 'dimensions:min_width=800,min_height=450'],
            'remove_cover' => ['nullable', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'type.*' => 'Scegli che tipo di evento è.',
            'title.required' => 'Scrivi il titolo dell’evento.',
            'title.max' => 'Il titolo può avere al massimo '.GroupSession::TITLE_MAX.' caratteri.',
            'description.max' => 'La descrizione può avere al massimo '.GroupSession::DESCRIPTION_MAX.' caratteri.',
            'discipline_id.*' => 'Scegli una disciplina dell’elenco.',
            'place.*' => 'Scegli dove si svolge.',
            'gym_profile_id.*' => 'Scegli una delle palestre dell’elenco.',
            'address.required' => 'Scrivi l’indirizzo.',
            'address.max' => 'L’indirizzo può avere al massimo 160 caratteri.',
            'city_id.*' => 'Scegli la città.',
            'date.*' => 'Scegli la data.',
            'start.*' => 'Scrivi l’ora di inizio.',
            'end.*' => 'Scrivi l’ora di fine.',
            'capacity.*' => 'I posti devono essere da 1 a '.GroupSession::MAX_CAPACITY.'.',
            'price_cents.*' => 'Scrivi un prezzo valido, o 0 se è gratis.',
            'dates.*' => 'Si può ripetere per al massimo '.GroupSession::MAX_DATES.' settimane.',
            'cover.image' => 'La foto deve essere un’immagine JPG o PNG.',
            'cover.mimes' => 'La foto deve essere un’immagine JPG o PNG.',
            'cover.max' => 'La foto può pesare al massimo 5 MB.',
            'cover.dimensions' => 'La foto deve essere almeno 800 × 450 px.',
        ];
    }
}
