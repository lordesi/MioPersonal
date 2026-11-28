<?php

namespace App\Http\Controllers;

use App\Actions\Bookings\CreateTrainerSession;
use App\Actions\Trainer\AddClientRecord;
use App\Enums\BookingActor;
use App\Http\Controllers\Concerns\BuildsTrainerArea;
use App\Models\Booking;
use App\Models\TrainerClient;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Support\TrainerSlots;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

/**
 * "Aggiungi seduta" in the trainer's calendar (CreateTrainerSession): with
 * someone of the list or someone new, added on the spot. After a session with
 * someone without an account, "Invita Marco su Miopersonal" (the flash
 * `invitePrompt`), until the trainer says "Non chiedermelo più".
 */
class TrainerManualSessionController extends Controller
{
    use BuildsTrainerArea;

    public function store(Request $request, CreateTrainerSession $create, AddClientRecord $addRecord): RedirectResponse
    {
        $profile = $this->trainerProfile($request);

        $data = $request->validate([
            'client_record_id' => ['required_without:new_client', 'nullable', 'integer'],
            'new_client' => ['required_without:client_record_id', 'nullable', 'array'],
            'new_client.name' => ['required_with:new_client', 'string', 'max:'.TrainerClient::NAME_MAX],
            'new_client.email' => ['nullable', 'email:rfc', 'max:255'],
            'new_client.phone' => ['nullable', 'string', 'max:40', 'regex:/^[0-9+().\s-]*$/'],
            'service_id' => ['required', 'integer'],
            'date' => ['required', 'date_format:Y-m-d'],
            'time' => ['required', 'date_format:H:i'],
            'minutes' => ['required', 'integer'],
            'place_id' => ['nullable', 'integer'],
            // "Dal pacchetto": one of the client's packages, used up by this session.
            'client_package_id' => ['nullable', 'integer'],
            // "Note per la seduta": the trainer's own, as "Aggiungi nota".
            'note' => ['nullable', 'string', 'max:'.TrainerSessionNoteController::NOTE_MAX],
        ], [
            'client_record_id.required_without' => 'Scegli il cliente.',
            'new_client.name.required_with' => 'Scrivi il nome del cliente.',
            'new_client.email.email' => 'Scrivi un’email valida.',
            'new_client.phone.regex' => 'Il telefono può avere solo numeri, spazi e +.',
            'service_id.required' => 'Scegli la seduta.',
            'date.*' => 'Scegli il giorno.',
            'time.*' => 'Scegli l’ora.',
            'note.max' => 'La nota può avere al massimo '.TrainerSessionNoteController::NOTE_MAX.' caratteri.',
        ]);

        $service = $profile->services()->find((int) $data['service_id']) ?? throw ValidationException::withMessages(['service_id' => 'Scegli una delle tue sedute.']);
        $place = isset($data['place_id']) ? $profile->places()->find((int) $data['place_id']) : null;
        $start = CarbonImmutable::createFromFormat('Y-m-d H:i', "{$data['date']} {$data['time']}", 'Europe/Rome')
            ?? throw ValidationException::withMessages(['date' => 'Scegli il giorno.']);

        $record = isset($data['client_record_id'])
            ? $profile->clientRecords()->findOrFail((int) $data['client_record_id'])
            : $addRecord->handle($profile, $data['new_client']);
        $package = isset($data['client_package_id'])
            ? $profile->clientPackages()->find((int) $data['client_package_id']) ?? throw ValidationException::withMessages(['client_package_id' => CreateTrainerSession::PACKAGE_USED])
            : null;

        $booking = $create->handle($profile, $record, $service, $start, (int) $data['minutes'], $place, $package);
        $note = $this->clean($data['note'] ?? null);

        if ($note !== null) {
            $booking->forceFill(['trainer_note' => $note])->save();
        }

        if ($record->isRegistered()) {
            Inertia::flash('toast', ['type' => 'success', 'message' => "Proposta inviata: {$record->user?->first_name} riceverà una notifica per accettarla."]);

            return back();
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Seduta aggiunta al calendario.']);

        // "Invita Marco su Miopersonal": only once the profile is public (the link opens it).
        if ($record->invite_prompt_dismissed_at === null && TrainerProfile::query()->published()->whereKey($profile->id)->exists()) {
            Inertia::flash('invitePrompt', [
                'recordId' => $record->id,
                'name' => $record->name,
                'link' => $record->inviteLink($profile),
                'phone' => $record->phone,
                'email' => $record->email,
            ]);
        }

        return back();
    }

    /**
     * "Ritira proposta" of a session the client hasn't answered yet, or
     * "Elimina" of a session with someone without an account.
     */
    public function destroy(Request $request, Booking $booking): RedirectResponse
    {
        /** @var User $trainer */
        $trainer = $request->user();
        Gate::authorize('asTrainer', $booking);

        if (! $booking->isTrainerProposal() && ! ($booking->isOffApp() && $booking->canBeChangedByTrainer())) {
            throw ValidationException::withMessages(['booking' => 'Questa seduta non si può più togliere.']);
        }

        $booking->cancel(BookingActor::Trainer, $trainer);
        $booking->forceFill(['expires_at' => null])->save();
        TrainerSlots::refresh($booking->trainerProfile);

        Inertia::flash('toast', ['type' => 'success', 'message' => $booking->client_id === null ? 'Seduta tolta dal calendario.' : 'Proposta ritirata.']);

        return back();
    }

    /** "Non chiedermelo più per Marco". */
    public function dismissInvitePrompt(Request $request, TrainerClient $client): RedirectResponse
    {
        Gate::authorize('asTrainer', $client);

        $client->forceFill(['invite_prompt_dismissed_at' => now()])->save();

        return back();
    }

    private function clean(?string $value): ?string
    {
        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }
}
