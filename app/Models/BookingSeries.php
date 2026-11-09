<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * "Sedute fisse": every week, same day and time, for a client of the
 * trainer. See App\Actions\Bookings\GenerateSeries.
 *
 * @property int $id
 * @property int $trainer_profile_id
 * @property int $client_id
 * @property int|null $service_id
 * @property int|null $client_package_id
 * @property string $service_name
 * @property int $price_cents
 * @property int $minutes
 * @property string $place_label
 * @property int $weekday ISO: 1 = Monday … 7 = Sunday
 * @property string $start_time "HH:MM", Rome time
 * @property CarbonImmutable $starts_on
 * @property CarbonImmutable|null $ends_on
 * @property string $status
 * @property CarbonImmutable|null $ended_at
 * @property-read TrainerProfile $trainerProfile
 * @property-read User $client
 * @property-read ClientPackage|null $clientPackage
 */
#[Fillable([
    'client_id', 'service_id', 'client_package_id', 'service_name', 'price_cents', 'minutes', 'place_label',
    'weekday', 'start_time', 'starts_on', 'ends_on',
])]
class BookingSeries extends Model
{
    public const ACTIVE = 'active';

    public const ENDED = 'ended';

    /** @var list<string> */
    public const WEEKDAYS = ['lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato', 'domenica'];

    protected $table = 'booking_series';

    /** @var array<string, mixed> */
    protected $attributes = ['status' => self::ACTIVE];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'starts_on' => 'date',
            'ends_on' => 'date',
            'ended_at' => 'datetime',
            'weekday' => 'integer',
            'minutes' => 'integer',
            'price_cents' => 'integer',
        ];
    }

    public function isActive(): bool
    {
        return $this->status === self::ACTIVE;
    }

    /** "Ogni martedì alle 18:00" */
    public function label(): string
    {
        return 'Ogni '.self::WEEKDAYS[$this->weekday - 1].' alle '.$this->start_time;
    }

    /**
     * @param  Builder<self>  $query
     */
    public function scopeActive(Builder $query): void
    {
        $query->where('status', self::ACTIVE);
    }

    /**
     * @return BelongsTo<TrainerProfile, $this>
     */
    public function trainerProfile(): BelongsTo
    {
        return $this->belongsTo(TrainerProfile::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    /**
     * @return BelongsTo<ClientPackage, $this>
     */
    public function clientPackage(): BelongsTo
    {
        return $this->belongsTo(ClientPackage::class);
    }

    /**
     * @return HasMany<Booking, $this>
     */
    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'booking_series_id');
    }
}
