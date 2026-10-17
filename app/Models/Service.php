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
 * @property int $price_cents
 * @property bool $price_per_hour
 * @property bool $fixed_duration
 * @property string|null $note
 * @property bool $online_only
 * @property int|null $package_sessions
 * @property int $sort
 * @property bool $is_active
 */
#[Fillable([
    'name', 'kind', 'minutes', 'price_cents', 'price_per_hour', 'fixed_duration', 'note',
    'online_only', 'package_sessions', 'sort', 'is_active',
])]
class Service extends Model
{
    /** The name of the first session: fixed, the trainer can't change it. */
    public const FIRST_SESSION_NAME = 'Prima seduta';

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'minutes' => 'integer',
            'price_cents' => 'integer',
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
