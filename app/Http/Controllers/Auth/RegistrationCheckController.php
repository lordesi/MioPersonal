<?php

namespace App\Http\Controllers\Auth;

use App\Actions\Fortify\CreateNewUser;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

/**
 * The sign-up forms check email and phone while they are filled in, before
 * "Crea account": same rules as the sign-up, one field at a time.
 * `taken` opens the "Hai già un account?" pop-up.
 *
 * It tells whether an email has an account: the route is throttled so it
 * can't be used to try thousands of addresses.
 */
class RegistrationCheckController extends Controller
{
    public function __invoke(Request $request, CreateNewUser $creator): JsonResponse
    {
        $request->validate([
            'field' => ['required', 'in:email,phone'],
            'value' => ['nullable', 'string', 'max:255'],
        ]);

        /** @var 'email'|'phone' $field */
        $field = $request->string('field')->value();
        $value = $request->string('value')->value();

        if ($field === 'email') {
            // As in CreateNewUser: "Mario@Esempio.it " is "mario@esempio.it".
            $value = CreateNewUser::normalizeEmail($value);
        }

        $validator = Validator::make([$field => $value], [$field => $creator->rules()[$field]]);

        return response()->json([
            'error' => $validator->fails() ? $validator->errors()->first($field) : null,
            'taken' => $field === 'email'
                ? User::where('email', $value)->exists()
                : CreateNewUser::phoneInUse($value),
        ]);
    }
}
