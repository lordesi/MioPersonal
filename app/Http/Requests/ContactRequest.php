<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** The "Scrivici un messaggio" form of the Contatti page. */
class ContactRequest extends FormRequest
{
    /** "Sei": value => label. */
    public const ROLES = [
        'client' => 'Cliente',
        'trainer' => 'Personal trainer',
        'other' => 'Altro',
    ];

    /** "Argomento": value => label. */
    public const TOPICS = [
        'booking' => 'Una prenotazione',
        'account' => 'Il mio account',
        'trainer' => 'Un trainer',
        'profile' => 'Il mio profilo',
        'verification' => 'Verifica e approvazione',
        'calendar' => 'Prenotazioni e calendario',
        'partnership' => 'Collaborazioni',
        'press' => 'Stampa',
        'privacy' => 'Privacy e dati',
        'other' => 'Altro',
    ];

    /** The topics offered to each role, in the order of the design. */
    public const ROLE_TOPICS = [
        'client' => ['booking', 'account', 'trainer', 'privacy', 'other'],
        'trainer' => ['profile', 'verification', 'calendar', 'privacy', 'other'],
        'other' => ['partnership', 'press', 'privacy', 'other'],
    ];

    public const MESSAGE_MAX_LENGTH = 1500;

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $role = $this->string('role')->value();

        return [
            'role' => ['required', Rule::in(array_keys(self::ROLES))],
            'topic' => ['required', Rule::in(self::ROLE_TOPICS[$role] ?? [])],
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'string', 'email', 'max:255'],
            'message' => ['required', 'string', 'max:'.self::MESSAGE_MAX_LENGTH],
            'privacy' => ['accepted'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'privacy.accepted' => 'Per risponderti ci serve il tuo consenso.',
        ];
    }
}
