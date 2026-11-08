<?php

namespace App\Actions\GroupSessions;

use App\Enums\GroupSessionStatus;
use App\Enums\RegistrationStatus;
use App\Models\GroupSessionRegistration;
use App\Notifications\GroupSessionReminder;
use App\Notifications\SessionReminder;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;

/**
 * The reminders of the events, with the ones of the sessions
 * (bookings:remind): the day before and 2 hours before, to each client with
 * a place. Each place is marked once handled; a place taken inside the
 * window gets no reminder of that window (the confirmation just arrived).
 */
class SendGroupSessionReminders
{
    /** @return int how many reminders were sent */
    public function handle(): int
    {
        $now = CarbonImmutable::now();

        return $this->send(
            SessionReminder::DAY_BEFORE,
            'reminded_day_before_at',
            $now->addHours(SessionReminder::SOON_HOURS + 1),
            $now->addHours(SessionReminder::DAY_BEFORE_HOURS),
            SessionReminder::DAY_BEFORE_HOURS,
        ) + $this->send(
            SessionReminder::SOON,
            'reminded_soon_at',
            $now,
            $now->addHours(SessionReminder::SOON_HOURS),
            SessionReminder::SOON_HOURS,
        );
    }

    private function send(string $kind, string $column, CarbonImmutable $after, CarbonImmutable $until, int $hours): int
    {
        $sent = 0;

        GroupSessionRegistration::query()
            ->where('status', RegistrationStatus::Registered)
            ->whereNull($column)
            ->whereHas('groupSession', fn (Builder $session) => $session
                ->where('status', GroupSessionStatus::Published)
                ->whereNull('hidden_at')
                ->where('starts_at', '>', $after)
                ->where('starts_at', '<=', $until))
            ->with(['groupSession.gymProfile', 'groupSession.city', 'user'])
            ->chunkById(100, function ($registrations) use ($kind, $column, $hours, &$sent) {
                foreach ($registrations as $registration) {
                    // When the place was taken (or taken again): updated_at before this mark.
                    $takenAt = $registration->updated_at;
                    $registration->timestamps = false;
                    $registration->forceFill([$column => now()])->save();

                    // Taken after the reminder time: the confirmation is the reminder.
                    if ($takenAt !== null && $takenAt->gt($registration->groupSession->starts_at->subHours($hours))) {
                        continue;
                    }

                    $registration->user->notify(new GroupSessionReminder($registration->groupSession, $kind));
                    $sent++;
                }
            });

        return $sent;
    }
}
