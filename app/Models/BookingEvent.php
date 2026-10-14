<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A row of a booking's history: who did what, and when. Used later for
 * «Risponde di solito in 2 ore» and to rebuild what happened in a dispute.
 *
 * @property int $id
 * @property int $booking_id
 * @property string $type requested, confirmed, declined, cancelled or expired
 * @property int|null $actor_id null for the automatic ones
 * @property CarbonImmutable|null $created_at
 */
#[Fillable(['type', 'actor_id'])]
class BookingEvent extends Model
{
    public const UPDATED_AT = null;

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
    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
