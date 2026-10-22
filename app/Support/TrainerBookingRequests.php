<?php

namespace App\Support;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\BookingEvent;
use App\Models\TrainerProfile;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Collection;

/**
 * The bookings waiting for the trainer's answer: the page "Richieste" and the
 * summary in "Panoramica". The ones expiring first on top.
 */
final class TrainerBookingRequests
{
    /** "Gestite" shows the answers of the last days only. */
    public const HANDLED_DAYS = 30;

    /** At most this many rows in "Gestite". */
    public const HANDLED_LIMIT = 50;

    /**
     * @return HasMany<Booking, TrainerProfile>
     */
    public static function query(TrainerProfile $profile): HasMany
    {
        return $profile->bookings()
            ->awaitingAnswer()
            ->with(TrainerSessions::WITH)
            ->orderBy('expires_at');
    }

    /**
     * In the format of TrainerBookingRequest (resources/js/types/trainer.ts),
     * with how often the client shows up: it helps to decide.
     *
     * @param  Collection<int, Booking>  $requests
     * @return list<array<string, mixed>>
     */
    public static function rows(Collection $requests, TrainerProfile $profile): array
    {
        $attendance = ClientAttendance::forClients($requests->pluck('client_id'), $profile);

        return array_values($requests
            ->map(fn (Booking $booking) => [
                ...TrainerSessions::row($booking),
                'note' => $booking->client_note,
                // From requestedAt to expiresAt: the bar of the time left.
                'requestedAt' => ClientBookingData::iso($booking->created_at ?? now()),
                'expiresAt' => $booking->expires_at === null ? null : ClientBookingData::iso($booking->expires_at),
                // null once the client deleted the account.
                'attendance' => $booking->client_id === null ? null : $attendance[$booking->client_id],
            ])
            ->all());
    }

    /**
     * "Gestite": the requests the trainer confirmed or declined in the last
     * HANDLED_DAYS, and the ones that expired without an answer ("Annullata"),
     * the latest on top, in the format of TrainerHandledRequest. Not the ones
     * confirmed automatically (no actor), nor the ones cancelled afterwards.
     *
     * @return list<array<string, mixed>>
     */
    public static function handled(TrainerProfile $profile): array
    {
        return array_values(BookingEvent::query()
            ->where(fn (Builder $event) => $event
                ->where(fn (Builder $answer) => $answer
                    ->whereIn('type', ['confirmed', 'declined'])
                    ->where('actor_id', $profile->user_id))
                ->orWhere('type', 'expired'))
            ->where('created_at', '>=', now()->subDays(self::HANDLED_DAYS))
            ->whereHas('booking', fn (Builder $booking) => $booking
                ->where('trainer_profile_id', $profile->id)
                ->whereIn('status', [BookingStatus::Confirmed, BookingStatus::Declined, BookingStatus::Expired]))
            ->with(['booking' => fn ($booking) => $booking->with(TrainerSessions::WITH)])
            ->latest()
            ->latest('id')
            ->limit(self::HANDLED_LIMIT)
            ->get()
            ->map(fn (BookingEvent $event) => [
                ...TrainerSessions::row($event->booking),
                // "Pacchetto 10 sedute" or "Seduta singola", without "· seduta 2 di 10".
                'serviceType' => $event->booking->clientPackage->name ?? $event->booking->service_name,
                'package' => self::packageProgress($event->booking),
                'answer' => $event->type,
                'answeredAt' => ClientBookingData::iso($event->created_at ?? now()),
            ])
            ->all());
    }

    /**
     * "Seduta 2 di 10": only for a confirmed session, a declined or expired
     * one no longer takes a place of the package.
     *
     * @return array{position: int, total: int}|null
     */
    private static function packageProgress(Booking $booking): ?array
    {
        $position = BookingLabels::position($booking);

        if ($booking->clientPackage === null || $booking->status !== BookingStatus::Confirmed || $position === 0) {
            return null;
        }

        return ['position' => $position, 'total' => $booking->clientPackage->sessions_total];
    }
}
