<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;

/**
 * "Modifica profilo" in the trainer area: steps 2, 3 and 6 of "Diventa
 * trainer", with the same checks and messages. The services (step 4) are
 * changed from "Servizi", the hours (step 5) from "Disponibilità".
 */
class TrainerProfileUpdateRequest extends TrainerProfileRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return array_diff_key(parent::rules(), self::servicesRules(), self::availabilityRules());
    }
}
