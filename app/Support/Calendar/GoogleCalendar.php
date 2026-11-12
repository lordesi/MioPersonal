<?php

namespace App\Support\Calendar;

use App\Models\TrainerCalendarConnection;
use Carbon\CarbonImmutable;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

/**
 * The few calls to the Google Calendar API the app needs, for one trainer:
 * the "MioPersonal" calendar and its events. It renews the access token when
 * it expires. Without a library: plain HTTP.
 */
class GoogleCalendar
{
    private const API = 'https://www.googleapis.com/calendar/v3';

    private const TOKEN_URL = 'https://oauth2.googleapis.com/token';

    private const REVOKE_URL = 'https://oauth2.googleapis.com/revoke';

    /** The days asked to /freeBusy in one call. */
    private const BUSY_DAYS_PER_CALL = 30;

    /**
     * @param  int  $timeout  seconds for each call: short when a client is waiting
     */
    public function __construct(private readonly TrainerCalendarConnection $connection, private readonly int $timeout = 15) {}

    /** The id of the "MioPersonal" calendar, made on the first call. */
    public function calendarId(): string
    {
        if ($this->connection->calendar_id !== null) {
            return $this->connection->calendar_id;
        }

        $calendar = $this->send('post', '/calendars', [
            'summary' => TrainerCalendarConnection::CALENDAR_NAME,
            'description' => 'Le sedute e gli eventi di miopersonal.it. Non modificarlo da qui: si aggiorna da solo.',
            'timeZone' => 'Europe/Rome',
        ])->json();

        $this->connection->forceFill(['calendar_id' => $calendar['id']])->save();

        return $calendar['id'];
    }

    /**
     * Makes the event and returns its id.
     *
     * @param  array<string, mixed>  $event
     */
    public function insert(array $event): string
    {
        return (string) $this->send('post', '/calendars/'.rawurlencode($this->calendarId()).'/events', $event)->json('id');
    }

    /**
     * Changes the event. False if it's gone from Google (the trainer deleted it).
     *
     * @param  array<string, mixed>  $event
     */
    public function update(string $eventId, array $event): bool
    {
        $response = $this->send('put', '/calendars/'.rawurlencode($this->calendarId()).'/events/'.rawurlencode($eventId), $event, [404, 410]);

        // A cancelled event is "gone" too: Google keeps it for a while.
        return ! in_array($response->status(), [404, 410], true) && $response->json('status') !== 'cancelled';
    }

    /** Removes the event; already gone is fine. */
    public function delete(string $eventId): void
    {
        $this->send('delete', '/calendars/'.rawurlencode($this->calendarId()).'/events/'.rawurlencode($eventId), [], [404, 410]);
    }

    /**
     * "Blocca gli orari occupati": the calendars of the trainer that say when
     * they're busy. Theirs or shared with them to write on (a partner's, the
     * studio's); not the ones only to read (holidays, birthdays, someone
     * else's agenda), nor "MioPersonal", whose sessions are already here.
     *
     * @return list<string>
     */
    public function busyCalendarIds(): array
    {
        $ids = [];
        $pageToken = null;

        do {
            $query = http_build_query(array_filter(['minAccessRole' => 'writer', 'maxResults' => 250, 'pageToken' => $pageToken]));
            $page = $this->send('get', '/users/me/calendarList?'.$query)->json();

            foreach ($page['items'] ?? [] as $calendar) {
                if (($calendar['deleted'] ?? false) || $calendar['id'] === $this->connection->calendar_id) {
                    continue;
                }

                $ids[] = (string) $calendar['id'];
            }

            $pageToken = $page['nextPageToken'] ?? null;
        } while ($pageToken !== null);

        return $ids;
    }

    /**
     * When the trainer is busy between the two times, on these calendars:
     * only start and end, Google gives nothing else.
     *
     * @param  list<string>  $calendarIds
     * @return list<array{start: CarbonImmutable, end: CarbonImmutable}>
     */
    public function busy(CarbonImmutable $from, CarbonImmutable $to, array $calendarIds): array
    {
        $busy = [];

        // Google answers for 50 calendars and a few weeks at a time.
        foreach (array_chunk($calendarIds, 50) as $chunk) {
            for ($start = $from; $start->lessThan($to); $start = $start->addDays(self::BUSY_DAYS_PER_CALL)) {
                $end = $start->addDays(self::BUSY_DAYS_PER_CALL)->min($to);

                $calendars = $this->send('post', '/freeBusy', [
                    'timeMin' => $start->toRfc3339String(),
                    'timeMax' => $end->toRfc3339String(),
                    'items' => array_map(fn (string $id) => ['id' => $id], $chunk),
                ])->json('calendars', []);

                foreach ($calendars as $calendar) {
                    foreach ($calendar['busy'] ?? [] as $time) {
                        $busy[] = ['start' => CarbonImmutable::parse($time['start']), 'end' => CarbonImmutable::parse($time['end'])];
                    }
                }
            }
        }

        return $busy;
    }

    /** "Scollega": the calendar and all its events go, then the access is revoked. Best effort. */
    public function disconnect(): void
    {
        try {
            if ($this->connection->calendar_id !== null) {
                $this->send('delete', '/calendars/'.rawurlencode($this->connection->calendar_id), [], [404, 410]);
            }

            Http::asForm()->post(self::REVOKE_URL, ['token' => $this->connection->refresh_token ?? $this->connection->access_token]);
        } catch (\Throwable) {
            // The tokens are deleted by the caller anyway.
        }
    }

    /**
     * @param  array<string, mixed>  $data
     * @param  list<int>  $allowed  statuses that are answers, not errors
     *
     * @throws CalendarAccessRevoked when Google no longer accepts the access
     * @throws RequestException any other failure: worth another try later
     */
    private function send(string $method, string $path, array $data = [], array $allowed = []): Response
    {
        $this->ensureFreshToken();

        $response = $this->request($method, $path, $data);

        if ($response->status() === 401) {
            $this->refreshToken();
            $response = $this->request($method, $path, $data);
        }

        if ($response->status() === 401) {
            throw new CalendarAccessRevoked('Google non accetta più il collegamento.');
        }

        if ($response->status() === 403 && $this->isAccessDenied($response)) {
            throw new CalendarAccessRevoked('Google non accetta più il collegamento.', permissionOnly: true);
        }

        if (! in_array($response->status(), $allowed, true)) {
            $response->throw();
        }

        return $response;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function request(string $method, string $path, array $data): Response
    {
        /** @var PendingRequest $http */
        $http = Http::withToken($this->connection->access_token)->acceptJson()->timeout($this->timeout);

        return $method === 'delete' || $method === 'get'
            ? $http->{$method}(self::API.$path)
            : $http->{$method}(self::API.$path, $data);
    }

    /** 403 for a lost permission, not for a quota to wait for. */
    private function isAccessDenied(Response $response): bool
    {
        return in_array($response->json('error.errors.0.reason'), ['insufficientPermissions', 'forbidden', 'authError'], true)
            || $response->json('error.status') === 'PERMISSION_DENIED';
    }

    private function ensureFreshToken(): void
    {
        $expires = $this->connection->token_expires_at;

        if ($expires !== null && $expires->subMinute()->isPast()) {
            $this->refreshToken();
        }
    }

    private function refreshToken(): void
    {
        if ($this->connection->refresh_token === null) {
            throw new CalendarAccessRevoked('Manca il permesso di restare collegati.');
        }

        $response = Http::asForm()->timeout($this->timeout)->post(self::TOKEN_URL, [
            'client_id' => config('services.google-calendar.client_id'),
            'client_secret' => config('services.google-calendar.client_secret'),
            'refresh_token' => $this->connection->refresh_token,
            'grant_type' => 'refresh_token',
        ]);

        // The trainer removed the app from their Google account.
        if ($response->status() === 400 && $response->json('error') === 'invalid_grant') {
            throw new CalendarAccessRevoked('Hai tolto l’accesso dal tuo account Google.');
        }

        $response->throw();

        $this->connection->forceFill([
            'access_token' => $response->json('access_token'),
            'token_expires_at' => CarbonImmutable::now()->addSeconds((int) $response->json('expires_in', 3600)),
        ])->save();
    }
}
