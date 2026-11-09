<?php

namespace App\Actions\Trainer;

use App\Enums\BookingStatus;
use App\Models\TrainerClient;
use App\Models\TrainerProfile;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Keeps the trainer's list of clients ("Clienti") and the site accounts in
 * line. A person added by hand is later recognized when they sign up from
 * the personal link, or book with the same email: they become one client,
 * with the notes and payments the trainer already wrote.
 */
class LinkClient
{
    /** Session key: the personal links opened, by trainer profile id. */
    public const SESSION_KEY = 'trainer_client_tokens';

    /**
     * The record of this account in this trainer's list, made if there is none.
     * Called when the account books.
     */
    public function forBooking(TrainerProfile $profile, User $user, bool $fromSession = true): TrainerClient
    {
        $existing = $profile->clientRecords()->where('user_id', $user->id)->first();

        if ($existing !== null) {
            return $existing;
        }

        // The link they came from, or the same email the trainer wrote.
        $token = $fromSession ? session(self::SESSION_KEY.'.'.$profile->id) : null;
        $manual = $profile->clientRecords()->unclaimed()
            ->where(fn ($query) => $query
                ->when(is_string($token) && $token !== '', fn ($inner) => $inner->orWhere('invite_token', $token))
                ->orWhereRaw('lower(email) = ?', [mb_strtolower($user->email)]))
            ->first();

        if ($manual !== null) {
            $manual->forceFill(['user_id' => $user->id])->save();

            return $manual;
        }

        return $profile->clientRecords()->create(['user_id' => $user->id, 'name' => $user->name]);
    }

    /**
     * Someone logged in opens a personal link: if it is still free it becomes
     * theirs, without waiting for a booking. An account already in the list
     * (booked before) takes over the notes and payments of the link.
     */
    public function claimToken(TrainerProfile $profile, User $user, string $token): void
    {
        $record = $profile->clientRecords()->unclaimed()->where('invite_token', $token)->first();

        if ($record === null) {
            return;
        }

        $mine = $profile->clientRecords()->where('user_id', $user->id)->first();

        if ($mine === null) {
            $record->forceFill(['user_id' => $user->id])->save();

            return;
        }

        DB::transaction(function () use ($record, $mine) {
            $mine->forceFill([
                'goal' => $mine->goal ?: $record->goal,
                'private_notes' => collect([$mine->private_notes, $record->private_notes])->filter()->implode("\n\n") ?: null,
            ])->save();
            $record->payments()->update(['trainer_client_id' => $mine->id]);
            $record->delete();
        });
    }

    /**
     * Everyone with a confirmed session has a record: the ones from before
     * the list existed are made here, the first time the trainer opens it.
     */
    public function backfill(TrainerProfile $profile): void
    {
        $missing = User::query()
            ->whereIn('id', $profile->bookings()->where('status', BookingStatus::Confirmed)->whereNotNull('client_id')->select('client_id'))
            ->whereNotIn('id', $profile->clientRecords()->whereNotNull('user_id')->select('user_id'))
            ->get();

        foreach ($missing as $user) {
            $this->forBooking($profile, $user, fromSession: false);
        }
    }
}
