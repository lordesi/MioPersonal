<?php

namespace App\Support;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\TrainerProfile;

/**
 * A session as the pages of the trainer area show it (TrainerSession in
 * resources/js/types/trainer.ts): Panoramica, Richieste, Clienti.
 * Load the bookings with self::WITH.
 */
final class TrainerSessions
{
    /** The relations row() reads. */
    public const WITH = ['client', 'clientPackage.bookings'];

    /**
     * @return array{id: int, clientId: int|null, clientName: string, start: string, end: string, hours: float, serviceName: string, placeLabel: string, noShow: bool, kind: string, canChange: bool, proposedStart: string|null}
     */
    public static function row(Booking $booking): array
    {
        return [
            ...self::change($booking),
            'id' => $booking->id,
            // For the link to the client's profile; null once the account is deleted.
            'clientId' => $booking->client_id,
            // Clients are told the trainer sees their first and last name.
            'clientName' => $booking->client->name ?? 'Account eliminato',
            // UTC: the browser shows them in Europe/Rome.
            'start' => ClientBookingData::iso($booking->starts_at),
            'end' => ClientBookingData::iso($booking->ends_at),
            'hours' => $booking->starts_at->diffInMinutes($booking->ends_at) / 60,
            'serviceName' => BookingLabels::service($booking),
            'placeLabel' => $booking->place_label,
            // Marked "Saltata" by the trainer; otherwise done once it ends.
            'noShow' => $booking->no_show_at !== null,
            'kind' => $booking->status === BookingStatus::Confirmed ? 'confirmed' : 'pending',
        ];
    }

    /**
     * "Sposta" and "Annulla seduta" (TrainerSessionChangeController): whether
     * they show, and the time proposed to the client, if any.
     *
     * @return array{canChange: bool, proposedStart: string|null}
     */
    public static function change(Booking $booking): array
    {
        $proposal = $booking->proposal();

        return [
            'canChange' => $booking->canBeChangedByTrainer(),
            'proposedStart' => $proposal === null ? null : ClientBookingData::iso($proposal['start']),
        ];
    }

    /**
     * The free times to move a session to ("Sposta"): loaded only when the
     * dialog asks (?sposta={id}, partial reload of `rescheduleSlots`).
     *
     * @return list<array{date: string, closed: bool, slots: list<array{start: string, maxMinutes: int}>}>|null
     */
    public static function rescheduleSlots(?TrainerProfile $profile, int $bookingId): ?array
    {
        $booking = $profile?->bookings()->find($bookingId);

        if ($profile === null || $booking === null || ! $booking->canBeChangedByTrainer()) {
            return null;
        }

        return TrainerSlots::days($profile->load('workingHours'), $profile->booking_window_days, exceptBookingId: $booking->id);
    }
}
