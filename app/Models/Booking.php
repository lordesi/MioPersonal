<?php

namespace App\Models;

use App\Enums\BookingActor;
use App\Enums\BookingStatus;
use Carbon\CarbonImmutable;
use Database\Factories\BookingFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A session a client asked a trainer for (see docs/database/analisi.md §3.6).
 * Name, price and place are copied when booking: later changes of the
 * service don't touch it.
 *
 * @property int $id
 * @property int|null $client_id null once the client deleted the account
 * @property int $trainer_profile_id
 * @property int|null $service_id
 * @property CarbonImmutable $starts_at
 * @property CarbonImmutable $ends_at
 * @property CarbonImmutable $blocked_until end + the trainer's break
 * @property string $service_name
 * @property int $price_cents
 * @property string $place_label
 * @property BookingStatus $status
 * @property CarbonImmutable|null $expires_at
 * @property CarbonImmutable|null $confirmed_at
 * @property CarbonImmutable|null $cancelled_at
 * @property BookingActor|null $cancelled_by
 * @property string|null $client_note
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property-read User|null $client
 * @property-read TrainerProfile $trainerProfile
 */
#[Fillable([
    'client_id', 'trainer_profile_id', 'service_id',
    'starts_at', 'ends_at', 'blocked_until',
    'service_name', 'price_cents', 'place_label',
    'status', 'expires_at', 'confirmed_at', 'client_note',
])]
class Booking extends Model
{
    /** @use HasFactory<BookingFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'blocked_until' => 'datetime',
            'price_cents' => 'integer',
            'status' => BookingStatus::class,
            'expires_at' => 'datetime',
            'confirmed_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'cancelled_by' => BookingActor::class,
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    /**
     * @return BelongsTo<TrainerProfile, $this>
     */
    public function trainerProfile(): BelongsTo
    {
        return $this->belongsTo(TrainerProfile::class);
    }

    /**
     * @return HasMany<BookingEvent, $this>
     */
    public function events(): HasMany
    {
        return $this->hasMany(BookingEvent::class);
    }

    /**
     * The bookings that take their slot: confirmed, or pending and not expired yet.
     * A pending one past `expires_at` frees the slot even before `bookings:expire` runs.
     *
     * @param  Builder<self>  $query
     */
    public function scopeActive(Builder $query): void
    {
        $query->where(fn (Builder $active) => $active
            ->where('status', BookingStatus::Confirmed)
            ->orWhere(fn (Builder $pending) => $pending->awaitingAnswer()));
    }

    /**
     * Pending and not expired yet: the trainer can still answer.
     *
     * @param  Builder<self>  $query
     */
    public function scopeAwaitingAnswer(Builder $query): void
    {
        $query->where('status', BookingStatus::Pending)->where('expires_at', '>', now());
    }

    /** Pending, but the trainer did not answer in time. */
    public function isExpired(): bool
    {
        return $this->status === BookingStatus::Expired
            || ($this->status === BookingStatus::Pending && $this->expires_at !== null && $this->expires_at->isPast());
    }

    /** Still waiting for the trainer's answer. */
    public function isPending(): bool
    {
        return $this->status === BookingStatus::Pending && ! $this->isExpired();
    }

    /** Saves a row of the history: requested, confirmed, declined, cancelled, expired. */
    public function record(string $type, ?User $actor = null): void
    {
        $this->events()->create(['type' => $type, 'actor_id' => $actor?->id]);
    }

    /** Frees the slot; the history says who did it. */
    public function cancel(BookingActor $by, ?User $actor = null): void
    {
        $this->forceFill([
            'status' => BookingStatus::Cancelled,
            'cancelled_at' => now(),
            'cancelled_by' => $by,
        ])->save();

        $this->record('cancelled', $actor);
    }
}
