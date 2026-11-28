<?php

namespace App\Http\Controllers;

use App\Actions\Bookings\CreateTrainerSession;
use App\Actions\Trainer\AddClientRecord;
use App\Http\Controllers\Concerns\BuildsTrainerArea;
use App\Models\ClientPackage;
use App\Models\TrainerClient;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

/**
 * "Aggiungi pacchetto" in "Pacchetti attivi" of the trainer's Home: a
 * package the trainer sold outside the site, to someone of the list or
 * someone new. Bought at once: "Aggiungi seduta" uses it up, and a client
 * with an account books from it too ("Il tuo pacchetto").
 */
class TrainerPackageController extends Controller
{
    use BuildsTrainerArea;

    /** The most sessions in one package. */
    public const MAX_SESSIONS = 100;

    /** The highest price, in cents (€ 10.000). */
    public const MAX_PRICE_CENTS = 1_000_000;

    public function store(Request $request, AddClientRecord $addRecord): RedirectResponse
    {
        $profile = $this->trainerProfile($request);

        $data = $request->validate([
            'client_record_id' => ['required_without:new_client', 'nullable', 'integer'],
            'new_client' => ['required_without:client_record_id', 'nullable', 'array'],
            'new_client.name' => ['required_with:new_client', 'string', 'max:'.TrainerClient::NAME_MAX],
            'new_client.email' => ['nullable', 'email:rfc', 'max:255'],
            'new_client.phone' => ['nullable', 'string', 'max:40', 'regex:/^[0-9+().\s-]*$/'],
            // One of "Servizi e prezzi", or none: written by hand.
            'service_id' => ['nullable', 'integer'],
            'name' => ['required', 'string', 'max:100'],
            'sessions' => ['required', 'integer', 'min:1', 'max:'.self::MAX_SESSIONS],
            'price_cents' => ['required', 'integer', 'min:0', 'max:'.self::MAX_PRICE_CENTS],
            'minutes' => ['required', 'integer', 'min:'.CreateTrainerSession::MIN_MINUTES, 'max:'.CreateTrainerSession::MAX_MINUTES, 'multiple_of:5'],
        ], [
            'client_record_id.required_without' => 'Scegli il cliente.',
            'new_client.name.required_with' => 'Scrivi il nome del cliente.',
            'new_client.email.email' => 'Scrivi un’email valida.',
            'new_client.phone.regex' => 'Il telefono può avere solo numeri, spazi e +.',
            'name.required' => 'Dai un nome al pacchetto.',
            'name.max' => 'Il nome può avere al massimo 100 caratteri.',
            'sessions.*' => 'Le sedute incluse vanno da 1 a '.self::MAX_SESSIONS.'.',
            'price_cents.*' => 'Scrivi un prezzo valido.',
            'minutes.*' => 'La durata va da '.CreateTrainerSession::MIN_MINUTES.' a '.CreateTrainerSession::MAX_MINUTES.' minuti.',
        ]);

        $service = isset($data['service_id'])
            ? $profile->services()->where('kind', 'package')->find((int) $data['service_id']) ?? throw ValidationException::withMessages(['service_id' => 'Scegli uno dei tuoi pacchetti.'])
            : null;

        $record = isset($data['client_record_id'])
            ? $profile->clientRecords()->findOrFail((int) $data['client_record_id'])
            : $addRecord->handle($profile, $data['new_client']);

        ClientPackage::create([
            'client_id' => $record->user_id,
            'trainer_client_id' => $record->id,
            'trainer_profile_id' => $profile->id,
            'service_id' => $service?->id,
            'name' => trim($data['name']),
            'price_cents' => (int) $data['price_cents'],
            'sessions_total' => (int) $data['sessions'],
            'minutes' => (int) $data['minutes'],
            'bought_at' => now(),
        ]);

        $name = $record->user->name ?? $record->name;
        Inertia::flash('toast', ['type' => 'success', 'message' => "Pacchetto aggiunto a {$name}."]);

        return back();
    }
}
