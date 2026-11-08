<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A service of a trainer ("Seduta singola", "Pacchetto 10 sedute").
 * Prices are indicative, in whole cents: payment happens outside MioPersonal.
 *
 * @property int $id
 * @property int $trainer_profile_id
 * @property string $name
 * @property string $kind session or package
 * @property int $minutes
 * @property int $price_cents for one person
 * @property array<int, int>|null $group_prices "Invita un amico": {"2": 7000, "3": 9000} (keys read as numbers), the total for that many people
 * @property bool $price_per_hour
 * @property bool $fixed_duration
 * @property string|null $note
 * @property bool $online_only
 * @property int|null $package_sessions
 * @property int $sort
 * @property bool $is_active
 */
#[Fillable([
    'name', 'kind', 'minutes', 'price_cents', 'group_prices', 'price_per_hour', 'fixed_duration', 'note',
    'online_only', 'package_sessions', 'sort', 'is_active',
])]
class Service extends Model
{
    /** The name of the first session: fixed, the trainer can't change it. */
    public const FIRST_SESSION_NAME = 'Prima seduta';

    /** "Invita un amico": at most this many people in a session, the booker included. */
    public const MAX_PEOPLE = 5;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'minutes' => 'integer',
            'price_cents' => 'integer',
            'group_prices' => 'array',
            'price_per_hour' => 'boolean',
            'fixed_duration' => 'boolean',
            'online_only' => 'boolean',
            'package_sessions' => 'integer',
            'sort' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /**
     * The first session: a session with a fixed duration (the kinds of
     * session let the client choose it). Only for a client's first booking.
     */
    public function isFirstSession(): bool
    {
        return $this->kind === 'session' && $this->fixed_duration;
    }

    /**
     * "Invita un amico": a kind of session (never the first session, a
     * package or the separate online prices) can be booked for more people.
     */
    public function allowsGroup(): bool
    {
        return $this->kind === 'session' && ! $this->fixed_duration && ! $this->online_only;
    }

    /** How many people can come, the booker included: 1 without group prices. */
    public function maxPeople(): int
    {
        if (! $this->allowsGroup() || empty($this->group_prices)) {
            return 1;
        }

        return max(1, ...array_keys($this->group_prices));
    }

    /** The total price for that many people, or null if they can't come. */
    public function priceFor(int $people): ?int
    {
        if ($people === 1) {
            return $this->price_cents;
        }

        if ($people < 1 || $people > $this->maxPeople()) {
            return null;
        }

        return $this->group_prices[$people] ?? null;
    }

    /**
     * The total for each number of people, from 1: [1 => 5000, 2 => 7000].
     *
     * @return array<int, int>
     */
    public function pricesByPeople(): array
    {
        $prices = [];

        for ($people = 1; $people <= $this->maxPeople(); $people++) {
            $price = $this->priceFor($people);

            if ($price !== null) {
                $prices[$people] = $price;
            }
        }

        return $prices;
    }

    /**
     * The name as clients read it: the online prices of a kind of session
     * have its same name, with "(online)" after it.
     */
    public function displayName(): string
    {
        return $this->online_only ? "{$this->name} (online)" : $this->name;
    }

    /**
     * @return BelongsTo<TrainerProfile, $this>
     */
    public function trainerProfile(): BelongsTo
    {
        return $this->belongsTo(TrainerProfile::class);
    }
}
