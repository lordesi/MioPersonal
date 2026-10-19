<?php

namespace App\Models;

use App\Enums\BookingStatus;
use Carbon\CarbonImmutable;
use Database\Factories\ClientPackageFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A package of sessions a client bought from a trainer ("Pacchetto 10 sedute"),
 * see docs/database/analisi.md §3.4.
 *
 * Booking a package service creates it, together with its first session; it
 * is bought (`bought_at`) once that session is confirmed. The sessions used are
 * counted from the linked bookings: a cancelled one is free again.
 *
 * @property int $id
 * @property int|null $client_id null once the client deleted the account
 * @property int $trainer_profile_id
 * @property int|null $service_id null once the trainer changed the services
 * @property string $name
 * @property int $price_cents
 * @property int $sessions_total
 * @property int $minutes
 * @property CarbonImmutable|null $bought_at
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property int|null $booked_count with withSessionCounts()
 * @property int|null $done_count with withSessionCounts()
 * @property-read User|null $client
 * @property-read TrainerProfile $trainerProfile
 */
#[Fillable([
    'client_id', 'trainer_profile_id', 'service_id',
    'name', 'price_cents', 'sessions_total', 'minutes', 'bought_at',
])]
class ClientPackage extends Model
{
    /** @use HasFactory<ClientPackageFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'price_cents' => 'integer',
            'sessions_total' => 'integer',
            'minutes' => 'integer',
            'bought_at' => 'datetime',
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
     * @return HasMany<Booking, $this>
     */
    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    /**
     * Its first session was confirmed: before that it is only a request.
     *
     * @param  Builder<self>  $query
     */
    public function scopeBought(Builder $query): void
    {
        $query->whereNotNull('bought_at');
    }

    /**
     * The sessions that take a place of the package: confirmed or waiting for an answer.
     *
     * @return HasMany<Booking, $this>
     */
    public function activeBookings(): HasMany
    {
        return $this->hasMany(Booking::class)->active();
    }

    /**
     * The sessions done: confirmed, over and not marked "Saltata".
     *
     * @return HasMany<Booking, $this>
     */
    public function doneBookings(): HasMany
    {
        return $this->hasMany(Booking::class)
            ->where('status', BookingStatus::Confirmed)
            ->where('ends_at', '<=', now())
            ->whereNull('no_show_at');
    }

    /**
     * Adds `booked_count` and `done_count`: one query for a whole list.
     *
     * @param  Builder<self>  $query
     */
    public function scopeWithSessionCounts(Builder $query): void
    {
        $query->withCount(['activeBookings as booked_count', 'doneBookings as done_count']);
    }

    /** Sessions that take a place of the package: confirmed or waiting for an answer. */
    public function bookedCount(): int
    {
        return $this->booked_count ?? $this->activeBookings()->count();
    }

    /** Sessions the client can still book. */
    public function remaining(): int
    {
        return max(0, $this->sessions_total - $this->bookedCount());
    }
}
