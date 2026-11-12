<?php

namespace App\Actions\Calendar;

use App\Enums\BookingStatus;
use App\Enums\GroupSessionStatus;
use App\Enums\GymLinkStatus;
use App\Models\Booking;
use App\Models\CalendarEvent;
use App\Models\GroupSession;
use App\Models\TrainerCalendarConnection;
use App\Support\Calendar\CalendarAccessRevoked;
use App\Support\Calendar\GoogleCalendar;
use App\Support\TrainerSlots;
use Carbon\CarbonImmutable;
use Throwable;

/**
 * Writes the sessions and events of a trainer on their Google calendar
 * "MioPersonal", one way: from the site to Google. A confirmed session
 * (or an event the trainer hosts) has its event; moved, it's changed;
 * cancelled, it's removed. The other way, optional, is SyncBusyTimes.
 *
 * Google failing never touches the booking: a lost access is saved on the
 * connection (the trainer sees "Ricollega"); any other failure is thrown
 * again, to be retried by the queue.
 */
class SyncCalendar
{
    /** A session ended more than this ago isn't put on the calendar any more. */
    private const PAST_DAYS = 1;

    /** One session: on the calendar of its trainer. */
    public function booking(Booking $booking): void
    {
        $connection = TrainerCalendarConnection::query()->where('trainer_profile_id', $booking->trainer_profile_id)->first();

        if ($connection !== null) {
            $this->run([$connection], fn (TrainerCalendarConnection $connection, GoogleCalendar $google) => $this->syncBooking($connection, $google, $booking));
        }
    }

    /** One event: on the calendar of each trainer who hosts it. */
    public function groupSession(GroupSession $session): void
    {
        $connections = TrainerCalendarConnection::query()
            ->where(fn ($query) => $query
                ->whereIn('trainer_profile_id', $session->hosts()->whereNotNull('trainer_profile_id')->select('trainer_profile_id'))
                // A trainer who is no longer a host: the event they had goes.
                ->orWhereHas('events', fn ($event) => $event->where('group_session_id', $session->id)))
            ->get();

        $this->run($connections->all(), fn (TrainerCalendarConnection $connection, GoogleCalendar $google) => $this->syncGroupSession($connection, $google, $session));
    }

    /**
     * Everything still to come, and what Google has but shouldn't: after
     * "Collega" and in the daily `calendar:resync`.
     */
    public function everything(TrainerCalendarConnection $connection): void
    {
        $this->run([$connection], function (TrainerCalendarConnection $connection, GoogleCalendar $google) {
            $profileId = $connection->trainer_profile_id;
            $limit = now()->subDays(self::PAST_DAYS);

            Booking::query()
                ->where('trainer_profile_id', $profileId)
                ->where('status', BookingStatus::Confirmed)
                ->where('ends_at', '>', $limit)
                ->with('client')
                ->each(fn (Booking $booking) => $this->syncBooking($connection, $google, $booking));

            GroupSession::query()
                ->whereHas('hosts', fn ($host) => $host->where('trainer_profile_id', $profileId))
                ->where('status', GroupSessionStatus::Published)
                ->where('ends_at', '>', $limit)
                ->each(fn (GroupSession $session) => $this->syncGroupSession($connection, $google, $session));

            // Events of sessions that are no longer to be there (cancelled while the link was off…).
            $connection->events()->whereNotNull('booking_id')->with('booking')->get()
                ->filter(fn (CalendarEvent $event) => $event->booking === null || $event->booking->status !== BookingStatus::Confirmed)
                ->each(fn (CalendarEvent $event) => $this->forget($google, $event));
        });
    }

    /**
     * @param  iterable<TrainerCalendarConnection>  $connections
     * @param  callable(TrainerCalendarConnection, GoogleCalendar): void  $work
     */
    private function run(iterable $connections, callable $work): void
    {
        $failure = null;

        foreach ($connections as $connection) {
            // Already known to be lost: nothing to try until they link again.
            if ($connection->needsReconnect()) {
                continue;
            }

            try {
                $work($connection, new GoogleCalendar($connection));
                $connection->forceFill(['last_error' => null, 'last_synced_at' => now()])->save();
            } catch (CalendarAccessRevoked $exception) {
                $connection->forceFill(['last_error' => $exception->getMessage()])->save();
            } catch (Throwable $exception) {
                $failure ??= $exception;
            }
        }

        if ($failure !== null) {
            throw $failure;
        }
    }

    private function syncBooking(TrainerCalendarConnection $connection, GoogleCalendar $google, Booking $booking): void
    {
        $event = $connection->events()->where('booking_id', $booking->id)->first();

        if ($booking->status !== BookingStatus::Confirmed) {
            $event !== null && $this->forget($google, $event);

            return;
        }

        // Too old to be worth a new event (but one already there is kept up to date).
        if ($event === null && $booking->ends_at->lt(now()->subDays(self::PAST_DAYS))) {
            return;
        }

        $this->write($connection, $google, $event, $this->bookingEvent($booking), ['booking_id' => $booking->id]);
    }

    private function syncGroupSession(TrainerCalendarConnection $connection, GoogleCalendar $google, GroupSession $session): void
    {
        $event = $connection->events()->where('group_session_id', $session->id)->first();

        $hosted = $session->hosts()
            ->where('trainer_profile_id', $connection->trainer_profile_id)
            ->where('status', GymLinkStatus::Accepted)
            ->exists();

        if ($session->status !== GroupSessionStatus::Published || ! $hosted) {
            $event !== null && $this->forget($google, $event);

            return;
        }

        if ($event === null && $session->ends_at->lt(now()->subDays(self::PAST_DAYS))) {
            return;
        }

        $this->write($connection, $google, $event, $this->groupSessionEvent($session), ['group_session_id' => $session->id]);
    }

    /**
     * Changes the event, or makes it (also if the trainer deleted it from Google).
     *
     * @param  array<string, mixed>  $payload
     * @param  array<string, int>  $subject  booking_id or group_session_id
     */
    private function write(TrainerCalendarConnection $connection, GoogleCalendar $google, ?CalendarEvent $event, array $payload, array $subject): void
    {
        if ($event !== null && $google->update($event->google_event_id, $payload)) {
            $event->touch();

            return;
        }

        $id = $google->insert($payload);

        if ($event !== null) {
            $event->update(['google_event_id' => $id]);
        } else {
            $connection->events()->create([...$subject, 'google_event_id' => $id]);
        }
    }

    private function forget(GoogleCalendar $google, CalendarEvent $event): void
    {
        $google->delete($event->google_event_id);
        $event->delete();
    }

    /**
     * @return array<string, mixed>
     */
    private function bookingEvent(Booking $booking): array
    {
        $guests = $booking->people > 1 ? " ({$booking->people} persone)" : '';
        $client = $booking->client->name ?? $booking->trainerClient->name ?? 'Cliente';

        return [
            'summary' => "{$booking->service_name} · {$client}{$guests}",
            'location' => $booking->place_label,
            'description' => "Seduta prenotata su MioPersonal.\n".route('trainer.clients', ['cliente' => $booking->client_id]),
            ...$this->times($booking->starts_at, $booking->ends_at),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function groupSessionEvent(GroupSession $session): array
    {
        return [
            'summary' => $session->title,
            'location' => $session->address ?? '',
            'description' => "Evento su MioPersonal.\n".route('events.show', $session->slug),
            ...$this->times($session->starts_at, $session->ends_at),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function times(\DateTimeInterface $start, \DateTimeInterface $end): array
    {
        $format = fn (\DateTimeInterface $moment) => [
            'dateTime' => CarbonImmutable::instance($moment)->setTimezone(TrainerSlots::TIMEZONE)->toRfc3339String(),
            'timeZone' => TrainerSlots::TIMEZONE,
        ];

        return ['start' => $format($start), 'end' => $format($end), 'reminders' => ['useDefault' => true]];
    }
}
