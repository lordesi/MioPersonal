<?php

namespace App\Http\Controllers\Admin;

use App\Enums\BookingActor;
use App\Enums\BookingStatus;
use App\Http\Controllers\Admin\Concerns\BuildsAdminArea;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Prenotazioni": the bookings of the platform, the newest first. ?cerca=1048
 * (from the search box, "#1048") shows that one only.
 */
class AdminBookingsController extends Controller
{
    use BuildsAdminArea;

    /** Enough for the beta: older ones are found by number. */
    private const LIMIT = 200;

    public function __invoke(Request $request): Response
    {
        $id = $request->integer('cerca');

        $bookings = Booking::query()
            ->with(['client', 'trainerProfile.user'])
            ->when($id > 0, fn ($query) => $query->whereKey($id))
            ->latest('id')
            ->limit(self::LIMIT)
            ->get();

        return Inertia::render('admin/bookings', [
            'adminArea' => $this->adminArea(),
            'search' => $id > 0 ? $id : null,
            'bookings' => $bookings->map(fn (Booking $booking) => [
                'id' => $booking->id,
                // Deleted accounts leave their past bookings without the client.
                'clientName' => $booking->client->name ?? 'Account eliminato',
                'trainerName' => $booking->trainerProfile->user->name,
                'start' => $booking->starts_at->toIso8601ZuluString(),
                'hours' => round($booking->starts_at->diffInMinutes($booking->ends_at) / 60, 1),
                'serviceName' => $booking->service_name,
                'status' => self::status($booking),
                'expiresAt' => self::status($booking) === 'pending' ? $booking->expires_at?->toIso8601ZuluString() : null,
                'note' => self::note($booking),
            ])->all(),
        ]);
    }

    /**
     * The status of the page: a confirmed session already over is "completed"
     * (or "no_show"), a request past its deadline is "expired" even before
     * `bookings:expire` runs.
     */
    private static function status(Booking $booking): string
    {
        return match ($booking->status) {
            BookingStatus::Pending => $booking->isExpired() ? 'expired' : 'pending',
            BookingStatus::Confirmed => match (true) {
                $booking->no_show_at !== null => 'no_show',
                $booking->ends_at->isPast() => 'completed',
                default => 'confirmed',
            },
            default => $booking->status->value,
        };
    }

    /** "Dal cliente, 30 h prima", "Nessuna risposta in tempo", "Segnata dal trainer". */
    private static function note(Booking $booking): ?string
    {
        return match (self::status($booking)) {
            'cancelled' => self::cancelledNote($booking),
            'expired' => 'Nessuna risposta in tempo',
            'no_show' => 'Segnata dal trainer',
            default => null,
        };
    }

    private static function cancelledNote(Booking $booking): ?string
    {
        $who = match ($booking->cancelled_by) {
            BookingActor::Client => 'Dal cliente',
            BookingActor::Trainer => 'Dal trainer',
            BookingActor::System => 'In automatico',
            null => null,
        };

        if ($who === null || $booking->cancelled_at === null) {
            return $who;
        }

        $hours = (int) $booking->cancelled_at->diffInHours($booking->starts_at);

        return $hours > 0 ? "{$who}, {$hours} h prima" : $who;
    }
}
