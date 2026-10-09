<?php

namespace App\Actions\Fortify;

use App\Concerns\ProfileValidationRules;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use ProfileValidationRules;

    /**
     * Validate and create a newly registered user (client or trainer).
     *
     * TODO: save phone, marketing consent and role once the users table has those columns.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => $this->emailRules(),
            // The design has no "repeat password" field: the show/hide button replaces it.
            'password' => ['required', 'string', Password::default()],
            'terms' => ['accepted'],
        ])->validate();

        return User::create([
            'name' => trim($input['first_name']).' '.trim($input['last_name']),
            'email' => $input['email'],
            'password' => $input['password'],
        ]);
    }
}
