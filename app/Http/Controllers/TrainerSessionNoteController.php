<?php

namespace App\Http\Controllers;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * "Aggiungi nota" on a confirmed session (Home, Calendario, the card of a
 * client): what was done, how it went. Only the trainer reads it.
 */
class TrainerSessionNoteController extends Controller
{
    /** As the textarea of the page. */
    public const NOTE_MAX = 1000;

    public function update(Request $request, Booking $booking): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        abort_unless(
            $booking->trainer_profile_id === $user->trainerProfile?->id
                && $booking->status === BookingStatus::Confirmed,
            404,
        );

        $data = $request->validate([
            'note' => ['nullable', 'string', 'max:'.self::NOTE_MAX],
        ], [
            'note.max' => 'La nota può avere al massimo '.self::NOTE_MAX.' caratteri.',
        ]);

        $note = trim((string) ($data['note'] ?? ''));
        $booking->forceFill(['trainer_note' => $note === '' ? null : $note])->save();

        return back();
    }
}
