<?php

namespace App\Actions\GroupSessions;

use App\Enums\RegistrationStatus;
use App\Enums\UserRole;
use App\Models\GroupSession;
use App\Models\GroupSessionRegistration;
use App\Models\User;
use App\Notifications\GroupSessionChanged;
use App\Notifications\GroupSessionJoined;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * The places of an event: a client takes one (confirmed at once while there
 * are places left) and gives it back; an organizer takes one back, or sets
 * the places left by hand for the people who booked outside the app.
 * The event is locked: two clients can't take the last place.
 */
class GroupSessionPlaces
{
    public function register(GroupSession $session, User $client): GroupSessionRegistration
    {
        if ($client->role !== UserRole::Client) {
            throw ValidationException::withMessages(['place' => 'Solo i clienti possono iscriversi agli eventi.']);
        }

        $registration = DB::transaction(function () use ($session, $client) {
            $session = GroupSession::query()->whereKey($session->id)->lockForUpdate()->firstOrFail();

            if (! $session->isOpen()) {
                throw ValidationException::withMessages(['place' => $session->isCancelled()
                    ? 'Questo evento è stato annullato.'
                    : 'Le iscrizioni a questo evento sono chiuse.']);
            }

            /** @var GroupSessionRegistration|null $registration */
            $registration = $session->registrations()->where('user_id', $client->id)->first();

            if ($registration?->isActive()) {
                throw ValidationException::withMessages(['place' => 'Sei già iscritto a questo evento.']);
            }

            if ($session->remainingSeats() < 1) {
                throw ValidationException::withMessages(['place' => 'I posti sono finiti.']);
            }

            if ($registration !== null) {
                // Given back and taken again: the reminders go out again too.
                $registration->update(['status' => RegistrationStatus::Registered, 'reminded_day_before_at' => null, 'reminded_soon_at' => null]);

                return $registration;
            }

            return $session->registrations()->create(['user_id' => $client->id, 'status' => RegistrationStatus::Registered]);
        });

        $client->notify(new GroupSessionJoined($registration->groupSession));

        return $registration;
    }

    /** The client gives the place back, until the event starts. */
    public function cancel(GroupSession $session, User $client): void
    {
        if ($session->hasStarted()) {
            throw ValidationException::withMessages(['place' => 'L’evento è già iniziato.']);
        }

        $updated = $session->activeRegistrations()->where('user_id', $client->id)->update(['status' => RegistrationStatus::Cancelled]);

        if ($updated === 0) {
            throw ValidationException::withMessages(['place' => 'Non sei iscritto a questo evento.']);
        }
    }

    /** An organizer takes a place back: the client is told. */
    public function remove(GroupSessionRegistration $registration): void
    {
        if (! $registration->isActive()) {
            return;
        }

        $registration->update(['status' => RegistrationStatus::Removed]);
        $registration->user->notify(new GroupSessionChanged($registration->groupSession, GroupSessionChanged::REMOVED));
    }

    /**
     * "Posti rimasti": the places the app still gives; the others are taken
     * outside the app.
     */
    public function setRemaining(GroupSession $session, int $remaining): void
    {
        DB::transaction(function () use ($session, $remaining) {
            $session = GroupSession::query()->whereKey($session->id)->lockForUpdate()->firstOrFail();
            $free = $session->capacity - $session->activeRegistrations()->count();

            if ($remaining < 0 || $remaining > $free) {
                throw ValidationException::withMessages(['remaining' => $free <= 0
                    ? 'Tutti i posti sono già presi dagli iscritti: aumenta i posti dell’evento.'
                    : "I posti rimasti possono essere da 0 a {$free}."]);
            }

            $session->update(['offline_seats' => $free - $remaining]);
        });
    }
}
