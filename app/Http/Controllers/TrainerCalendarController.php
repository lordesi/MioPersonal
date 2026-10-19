<?php

namespace App\Http\Controllers;

use App\Enums\BookingStatus;
use App\Http\Controllers\Concerns\BuildsPlaceholderData;
use App\Models\Booking;
use App\Models\User;
use App\Support\BookingLabels;
use App\Support\TrainerSessions;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Calendario" of the trainer: a week or a month of sessions, confirmed and
 * waiting for an answer. The URL says what to show, e.g.
 * ?vista=mese&giorno=2026-11-01, and only that period is loaded.
 *
 * The arrows go from 12 months before to 12 months after the current one:
 * the limits are computed from today, so they move by themselves every month.
 */
class TrainerCalendarController extends Controller
{
    use BuildsPlaceholderData;

    /** How many months before and after the current one can be shown. */
    public const MONTHS_AROUND = 12;

    public function __invoke(Request $request): Response
    {
        /** @var User $trainer */
        $trainer = $request->user();
        $profile = $trainer->trainerProfile;

        $today = $this->romeNow()->startOfDay();
        $minDate = $today->startOfMonth()->subMonths(self::MONTHS_AROUND);
        $maxDate = $today->startOfMonth()->addMonths(self::MONTHS_AROUND)->endOfMonth()->startOfDay();

        $view = $request->query('vista') === 'mese' ? 'month' : 'week';
        // A day outside the limits shows the first or the last one.
        $focus = $this->focus($request->query('giorno'), $today)->max($minDate)->min($maxDate);

        $from = $view === 'month' ? $focus->startOfMonth() : $focus->startOfWeek(CarbonInterface::MONDAY);
        $to = $view === 'month' ? $from->addMonth() : $from->addWeek();

        return Inertia::render('trainer/calendar', [
            'trainerArea' => $this->trainerArea(),
            'view' => $view,
            'focus' => $focus->toDateString(),
            'minDate' => $minDate->toDateString(),
            'maxDate' => $maxDate->toDateString(),
            // No profile yet (registration not sent): nothing to show.
            'events' => $profile === null ? [] : $profile->bookings()
                // The requests still waiting take the slot too.
                ->where(fn (Builder $query) => $query
                    ->where('status', BookingStatus::Confirmed)
                    ->orWhere(fn (Builder $query) => $query->awaitingAnswer()))
                ->where('starts_at', '>=', $from->utc())
                ->where('starts_at', '<', $to->utc())
                ->with(TrainerSessions::WITH)
                ->orderBy('starts_at')
                ->get()
                ->map(fn (Booking $booking) => [
                    'id' => $booking->id,
                    'start' => $this->iso($booking->starts_at),
                    'end' => $this->iso($booking->ends_at),
                    // For the link to the client's profile; null once the account is deleted.
                    'clientId' => $booking->client_id,
                    'clientName' => $booking->client->name ?? 'Account eliminato',
                    // "Pacchetto 10 sedute · seduta 2 di 10" for the sessions of a package.
                    'serviceName' => BookingLabels::service($booking),
                    'placeLabel' => $booking->place_label,
                    'kind' => $booking->status === BookingStatus::Confirmed ? 'confirmed' : 'pending',
                ])
                ->all(),
        ]);
    }

    /** The day in `?giorno=2026-11-01`; today when it is missing or not a real day. */
    private function focus(mixed $value, CarbonImmutable $today): CarbonImmutable
    {
        if (is_string($value)
            && preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $value, $parts) === 1
            && checkdate((int) $parts[2], (int) $parts[3], (int) $parts[1])) {
            return CarbonImmutable::parse($value, 'Europe/Rome')->startOfDay();
        }

        return $today;
    }
}
