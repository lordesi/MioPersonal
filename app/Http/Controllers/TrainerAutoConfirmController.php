<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * "Conferma automatica" in "Richieste": the new requests are confirmed at
 * once, without waiting for an answer. The same setting of "Modifica
 * profilo", saved alone.
 */
class TrainerAutoConfirmController extends Controller
{
    public function __invoke(Request $request): RedirectResponse
    {
        $data = $request->validate(['auto_confirm' => ['required', 'boolean']]);

        /** @var User $trainer */
        $trainer = $request->user();
        $profile = $trainer->trainerProfile ?? abort(404);

        $profile->forceFill(['auto_confirm' => $data['auto_confirm']])->save();

        return back();
    }
}
