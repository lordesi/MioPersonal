<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Database\Factories\ReviewFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A client's review of a trainer, from 1 to 5 stars (docs/database/analisi.md §3.7).
 * After adding or hiding one, call TrainerProfile::refreshRating().
 *
 * @property int $id
 * @property int $trainer_profile_id
 * @property int|null $booking_id null for the demo reviews
 * @property int|null $client_id null once the client deleted the account
 * @property int $rating
 * @property string $text
 * @property string|null $reply
 * @property CarbonImmutable|null $replied_at
 * @property string|null $flag_reason
 * @property CarbonImmutable|null $hidden_at
 * @property int|null $hidden_by
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property-read TrainerProfile $trainerProfile
 * @property-read Booking|null $booking
 * @property-read User|null $client
 */
#[Fillable(['booking_id', 'client_id', 'rating', 'text', 'reply', 'replied_at'])]
class Review extends Model
{
    /** @use HasFactory<ReviewFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'rating' => 'integer',
            'replied_at' => 'datetime',
            'hidden_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<TrainerProfile, $this>
     */
    public function trainerProfile(): BelongsTo
    {
        return $this->belongsTo(TrainerProfile::class);
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
    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    /**
     * Not hidden by the team: the ones on the profile and in the average.
     *
     * @param  Builder<self>  $query
     */
    public function scopeNotHidden(Builder $query): void
    {
        $query->whereNull('hidden_at');
    }
}
