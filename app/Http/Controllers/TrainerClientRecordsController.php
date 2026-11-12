<?php

namespace App\Http\Controllers;

use App\Models\ClientPayment;
use App\Models\TrainerClient;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Notifications\TrainerNoteShared;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

/**
 * What the trainer writes on their clients in "Clienti": adding people they
 * already have (one or a pasted list), the private notes and goal, and the
 * payments noted by hand. Everything stays private to the trainer.
 */
class TrainerClientRecordsController extends Controller
{
    /** Lines accepted in one pasted list. */
    private const MAX_LINES = 100;

    /**
     * "Aggiungi clienti": one per line, "Nome Cognome, email o telefono".
     * The contact is optional; the personal link is what brings them in.
     */
    public function store(Request $request): RedirectResponse
    {
        $profile = $this->profile($request);
        $data = $request->validate(['list' => ['required', 'string', 'max:10000']], [
            'list.required' => 'Scrivi almeno un nome.',
        ]);

        $lines = collect(preg_split('/\R/u', $data['list']) ?: [])
            ->map(fn (string $line) => trim($line))
            ->filter()
            ->values();

        if ($lines->count() > self::MAX_LINES) {
            throw ValidationException::withMessages(['list' => 'Al massimo '.self::MAX_LINES.' clienti alla volta.']);
        }

        $rows = [];

        foreach ($lines as $index => $line) {
            $rows[] = $this->parseLine($line, $index + 1);
        }

        $knownEmails = $profile->clientRecords()->whereNotNull('email')->pluck('email')->map(fn (string $email) => mb_strtolower($email))->all();
        $added = 0;

        foreach ($rows as $row) {
            // The same email twice: it's the same person.
            if ($row['email'] !== null && in_array(mb_strtolower($row['email']), $knownEmails, true)) {
                continue;
            }

            $profile->clientRecords()->create($row);
            $row['email'] !== null && $knownEmails[] = mb_strtolower($row['email']);
            $added++;
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => $added === 1 ? 'Cliente aggiunto.' : "{$added} clienti aggiunti."]);

        return back();
    }

    /**
     * Notes, goal and, for who has no account yet, name and contacts. With an
     * account, also "Nota per il cliente": the client reads it in "Panoramica".
     */
    public function update(Request $request, TrainerClient $client): RedirectResponse
    {
        $this->authorizeRecord($request, $client);

        $data = $request->validate([
            'notes' => ['nullable', 'string', 'max:'.TrainerClient::NOTES_MAX],
            'goal' => ['nullable', 'string', 'max:200'],
            'shared_note' => $client->isRegistered() ? ['sometimes', 'nullable', 'string', 'max:'.TrainerClient::SHARED_NOTE_MAX] : ['prohibited'],
            'name' => $client->isRegistered() ? ['prohibited'] : ['sometimes', 'required', 'string', 'max:'.TrainerClient::NAME_MAX],
            'email' => $client->isRegistered() ? ['prohibited'] : ['sometimes', 'nullable', 'email:rfc', 'max:255'],
            'phone' => $client->isRegistered() ? ['prohibited'] : ['sometimes', 'nullable', 'string', 'max:40', 'regex:/^[0-9+().\s-]*$/'],
        ], [
            'name.prohibited' => 'Il nome lo sceglie il cliente nel suo account.',
            'shared_note.prohibited' => 'La nota per il cliente si può lasciare solo a chi ha un account.',
            'shared_note.max' => 'La nota per il cliente può avere al massimo '.TrainerClient::SHARED_NOTE_MAX.' caratteri.',
            'email.email' => 'Scrivi un’email valida.',
            'phone.regex' => 'Il telefono può avere solo numeri, spazi e +.',
        ]);

        $sharedNote = array_key_exists('shared_note', $data) ? $this->clean($data['shared_note']) : false;
        $noteChanged = $sharedNote !== false && $sharedNote !== $client->shared_note;

        $client->update(array_filter([
            'private_notes' => array_key_exists('notes', $data) ? $this->clean($data['notes']) : false,
            'goal' => array_key_exists('goal', $data) ? $this->clean($data['goal']) : false,
            'name' => $data['name'] ?? false,
            'email' => array_key_exists('email', $data) ? $this->clean($data['email']) : false,
            'phone' => array_key_exists('phone', $data) ? $this->clean($data['phone']) : false,
        ], fn ($value) => $value !== false));

        if ($noteChanged) {
            $client->forceFill(['shared_note' => $sharedNote, 'shared_note_at' => $sharedNote === null ? null : now()])->save();

            if ($sharedNote !== null) {
                $client->user?->notify(new TrainerNoteShared($client));
            }
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Scheda salvata.']);

        return back();
    }

    /** "Rimuovi": only who never signed up. An account in the list stays: it has sessions. */
    public function destroy(Request $request, TrainerClient $client): RedirectResponse
    {
        $this->authorizeRecord($request, $client);

        if ($client->isRegistered()) {
            throw ValidationException::withMessages(['client' => 'Questo cliente ha un account: non si può rimuovere.']);
        }

        $client->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Cliente rimosso.']);

        return back();
    }

    /** "Segna un incasso": amount in euros ("45" or "45,50"), the day and an optional note. */
    public function storePayment(Request $request, TrainerClient $client): RedirectResponse
    {
        $this->authorizeRecord($request, $client);

        $data = $request->validate([
            'amount' => ['required', 'regex:/^\d{1,5}([.,]\d{1,2})?$/'],
            'paid_on' => ['required', 'date_format:Y-m-d', 'before_or_equal:today'],
            'note' => ['nullable', 'string', 'max:200'],
        ], [
            'amount.required' => 'Scrivi quanto ha pagato.',
            'amount.regex' => 'Scrivi un importo in euro, per esempio 45 o 45,50.',
            'paid_on.required' => 'Scegli il giorno.',
            'paid_on.before_or_equal' => 'Il giorno non può essere nel futuro.',
        ]);

        $cents = (int) round(((float) str_replace(',', '.', $data['amount'])) * 100);

        if ($cents < 1) {
            throw ValidationException::withMessages(['amount' => 'L’importo deve essere maggiore di zero.']);
        }

        $client->payments()->create([
            'amount_cents' => $cents,
            'paid_on' => $data['paid_on'],
            'note' => $this->clean($data['note'] ?? null),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Incasso segnato.']);

        return back();
    }

    public function destroyPayment(Request $request, TrainerClient $client, ClientPayment $payment): RedirectResponse
    {
        $this->authorizeRecord($request, $client);
        abort_unless($payment->trainer_client_id === $client->id, 404);

        $payment->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Incasso eliminato.']);

        return back();
    }

    /**
     * @return array{name: string, email: string|null, phone: string|null}
     */
    private function parseLine(string $line, int $number): array
    {
        $parts = preg_split('/[,;\t]/u', $line, 2) ?: [$line];
        $name = trim($parts[0]);
        $contact = trim($parts[1] ?? '');

        if ($name === '' || mb_strlen($name) > TrainerClient::NAME_MAX) {
            throw ValidationException::withMessages(['list' => "Riga {$number}: il nome va da 1 a ".TrainerClient::NAME_MAX.' caratteri.']);
        }

        if ($contact === '') {
            return ['name' => $name, 'email' => null, 'phone' => null];
        }

        if (str_contains($contact, '@')) {
            if (filter_var($contact, FILTER_VALIDATE_EMAIL) === false || mb_strlen($contact) > 255) {
                throw ValidationException::withMessages(['list' => "Riga {$number}: l’email non è valida."]);
            }

            return ['name' => $name, 'email' => $contact, 'phone' => null];
        }

        if (preg_match('/^[0-9+().\s-]{5,40}$/', $contact) !== 1) {
            throw ValidationException::withMessages(['list' => "Riga {$number}: scrivi un’email o un telefono dopo la virgola."]);
        }

        return ['name' => $name, 'email' => null, 'phone' => $contact];
    }

    private function clean(?string $value): ?string
    {
        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }

    private function profile(Request $request): TrainerProfile
    {
        /** @var User $user */
        $user = $request->user();

        return $user->trainerProfile ?? abort(404);
    }

    /** Only the trainer's own list. */
    private function authorizeRecord(Request $request, TrainerClient $client): void
    {
        abort_unless($client->trainer_profile_id === $this->profile($request)->id, 404);
    }
}
