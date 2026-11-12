<?php

namespace App\Actions\Waitlist;

use App\Enums\BookingStatus;
use App\Enums\UserRole;
use App\Models\GroupSession;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Models\WaitlistEntry;
use App\Notifications\WaitlistOpened;
use App\Support\TrainerSlots;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Validation\ValidationException;

/**
 * "Avvisami se si libera": the lines for a full event and for a day a trainer
 * is full. Nobody is booked automatically: when a place or a slot is free, the
 * first ones in line are told (push and email) and the first to book gets it.
 * Who is told keeps the turn for WaitlistEntry::HOLD_HOURS; after that the next
 * one in line is told instead.
 */
class Waitlist
{
    /** Most people told at once for a day of a trainer: its free slots overlap, they are not all separate places. */
    private const MAX_PER_DAY = 3;

    public function joinEvent(User $client, GroupSession $session): void
    {
        $this->ensureClient($client);

        if (! $session->isOpen()) {
            throw ValidationException::withMessages(['waitlist' => 'Le iscrizioni a questo evento sono chiuse.']);
        }

        if ($session->activeRegistrations()->where('user_id', $client->id)->exists()) {
            throw ValidationException::withMessages(['waitlist' => 'Sei già iscritto a questo evento.']);
        }

        if ($session->remainingSeats() > 0) {
            throw ValidationException::withMessages(['waitlist' => 'Ci sono ancora posti liberi: prenota subito il tuo.']);
        }

        WaitlistEntry::query()->firstOrCreate(['user_id' => $client->id, 'group_session_id' => $session->id]);
    }

    public function leaveEvent(User $client, GroupSession $session): void
    {
        WaitlistEntry::query()->where('user_id', $client->id)->where('group_session_id', $session->id)->delete();
    }

    /**
     * @param  string  $date  Y-m-d, Rome
     */
    public function joinDay(User $client, TrainerProfile $profile, string $date): void
    {
        $this->ensureClient($client);

        $day = $this->dayOf($profile, $date);

        if ($profile->user_id === $client->id || $day === null) {
            throw ValidationException::withMessages(['waitlist' => 'Quel giorno non è tra quelli prenotabili.']);
        }

        // Only a full day: closed days have nothing to wait for, free days can be booked.
        if ($day['closed']) {
            throw ValidationException::withMessages(['waitlist' => 'Quel giorno il trainer non lavora.']);
        }

        if ($day['slots'] !== []) {
            throw ValidationException::withMessages(['waitlist' => 'Quel giorno ci sono ancora slot liberi: prenotane uno.']);
        }

        WaitlistEntry::query()->firstOrCreate(['user_id' => $client->id, 'trainer_profile_id' => $profile->id, 'day' => $date]);
    }

    public function leaveDay(User $client, TrainerProfile $profile, string $date): void
    {
        WaitlistEntry::query()->where('user_id', $client->id)->where('trainer_profile_id', $profile->id)->whereDate('day', $date)->delete();
    }

    /** A client who books that day (or takes the place) is out of the line. */
    public function forgetDay(User $client, TrainerProfile $profile, CarbonImmutable $start): void
    {
        $this->leaveDay($client, $profile, $start->setTimezone(TrainerSlots::TIMEZONE)->toDateString());
    }

    /**
     * The first ones in line for an event are told, as many as the places free
     * that are not already held by someone told before.
     */
    public function notifyEvent(GroupSession $session): void
    {
        $entries = WaitlistEntry::query()->where('group_session_id', $session->id);

        if (! $entries->exists()) {
            return;
        }

        // Nothing to wait for any more: cancelled, hidden or started.
        if (! $session->isOpen()) {
            $entries->delete();

            return;
        }

        $registered = $session->activeRegistrations()->pluck('user_id');
        WaitlistEntry::query()->where('group_session_id', $session->id)->whereIn('user_id', $registered)->delete();

        $free = $session->fresh()?->remainingSeats() ?? 0;

        $this->tell(
            WaitlistEntry::query()->where('group_session_id', $session->id),
            $free,
            fn (WaitlistEntry $entry) => $entry->user->notify(new WaitlistOpened($session)),
        );
    }

    /** The same for a day of a trainer: told when a slot is free on it. */
    public function notifyDay(TrainerProfile $profile, string $date): void
    {
        $entries = WaitlistEntry::query()->where('trainer_profile_id', $profile->id)->whereDate('day', $date);

        if (! $entries->exists()) {
            return;
        }

        $day = $this->dayOf($profile, $date);

        // Past the booking window or the day itself: nothing to wait for.
        if ($day === null || $profile->paused_at !== null) {
            if ($day === null) {
                $entries->delete();
            }

            return;
        }

        // Who already booked that day with this trainer is out of the line.
        $booked = $profile->bookings()
            ->whereIn('status', BookingStatus::active())
            ->whereBetween('starts_at', [
                CarbonImmutable::parse($date, TrainerSlots::TIMEZONE)->startOfDay()->utc(),
                CarbonImmutable::parse($date, TrainerSlots::TIMEZONE)->endOfDay()->utc(),
            ])
            ->pluck('client_id');
        WaitlistEntry::query()->where('trainer_profile_id', $profile->id)->whereDate('day', $date)->whereIn('user_id', $booked)->delete();

        $this->tell(
            WaitlistEntry::query()->where('trainer_profile_id', $profile->id)->whereDate('day', $date),
            min(count($day['slots']), self::MAX_PER_DAY),
            fn (WaitlistEntry $entry) => $entry->user->notify(new WaitlistOpened($profile, $date)),
        );
    }

    /**
     * Every line: the safety net run every few minutes (a capacity changed, an
     * override of the trainer's days, a booking marked expired…), and the old
     * lines cleaned.
     */
    public function sweep(): void
    {
        WaitlistEntry::query()->whereNotNull('group_session_id')->distinct()->pluck('group_session_id')
            ->each(function (int $id) {
                $session = GroupSession::query()->find($id);
                $session === null ? WaitlistEntry::query()->where('group_session_id', $id)->delete() : $this->notifyEvent($session);
            });

        // Days gone by.
        WaitlistEntry::query()->whereNotNull('trainer_profile_id')
            ->where('day', '<', CarbonImmutable::now(TrainerSlots::TIMEZONE)->toDateString())
            ->delete();

        WaitlistEntry::query()->whereNotNull('trainer_profile_id')->get(['trainer_profile_id', 'day'])
            ->unique(fn (WaitlistEntry $entry) => $entry->trainer_profile_id.'|'.$entry->day->toDateString())
            ->each(function (WaitlistEntry $entry) {
                $profile = TrainerProfile::query()->with('workingHours')->find($entry->trainer_profile_id);
                $profile === null ? null : $this->notifyDay($profile, $entry->day->toDateString());
            });
    }

    /**
     * Tells the first `$free` people who are not holding a turn already. Whoever
     * was told more than HOLD_HOURS ago and did nothing loses the turn.
     *
     * @param  Builder<WaitlistEntry>  $line
     * @param  callable(WaitlistEntry): void  $tell
     */
    private function tell($line, int $free, callable $tell): void
    {
        (clone $line)->where('notified_at', '<=', now()->subHours(WaitlistEntry::HOLD_HOURS))->delete();

        $holding = (clone $line)->whereNotNull('notified_at')->count();

        if ($free - $holding < 1) {
            return;
        }

        (clone $line)->whereNull('notified_at')->with('user')->orderBy('id')->limit($free - $holding)->get()
            ->each(function (WaitlistEntry $entry) use ($tell) {
                $entry->forceFill(['notified_at' => now()])->save();
                $tell($entry);
            });
    }

    /**
     * The day as TrainerSlots shows it, or null when it is not bookable (past, or beyond the window).
     *
     * @return array{date: string, closed: bool, slots: list<array{start: string, maxMinutes: int}>}|null
     */
    private function dayOf(TrainerProfile $profile, string $date): ?array
    {
        $today = CarbonImmutable::now(TrainerSlots::TIMEZONE)->startOfDay();
        $day = CarbonImmutable::createFromFormat('Y-m-d', $date, TrainerSlots::TIMEZONE);

        if ($day === null || ! $profile->isApproved() || $day->startOfDay()->lt($today)) {
            return null;
        }

        $index = (int) $today->diffInDays($day->startOfDay());

        if ($index >= $profile->booking_window_days) {
            return null;
        }

        return TrainerSlots::days($profile, $index + 1)[$index] ?? null;
    }

    private function ensureClient(User $client): void
    {
        if ($client->role !== UserRole::Client) {
            throw ValidationException::withMessages(['waitlist' => 'Solo i clienti possono mettersi in lista d’attesa.']);
        }
    }
}
