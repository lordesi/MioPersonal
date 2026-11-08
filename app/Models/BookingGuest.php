<?php

namespace App\Models;

use App\Enums\BookingGuestStatus;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * "Invita un amico": a friend who joined a session with the invite link of
 * the booking. Also kept after leaving, so the booker sees who said no.
 *
 * @property int $id
 * @property int $booking_id
 * @property int|null $user_id null once the guest deleted the account
 * @property BookingGuestStatus $status
 * @property CarbonImmutable|null $created_at when the guest joined
 * @property CarbonImmutable|null $updated_at
 * @property-read Booking $booking
 * @property-read User|null $user
 */
#[Fillable(['booking_id', 'user_id', 'status'])]
class BookingGuest extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => BookingGuestStatus::class,
        ];
    }

    /**
     * Who still comes.
     *
     * @param  Builder<self>  $query
     */
    public function scopeJoined(Builder $query): void
    {
        $query->where('status', BookingGuestStatus::Joined);
    }

    /**
     * @return BelongsTo<Booking, $this>
     */
    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
