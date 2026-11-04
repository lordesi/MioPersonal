<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/** The choice of the cookie banner and of "Impostazioni cookie". */
class CookieConsentRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'analytics' => ['required', 'boolean'],
            'marketing' => ['required', 'boolean'],
        ];
    }
}
