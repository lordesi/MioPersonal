<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * The Google account a trainer linked ("Collega Google Calendar"). The app
 * writes the confirmed sessions on a calendar "MioPersonal" it makes there;
 * it never reads the trainer's own calendars.
 *
 * @property int $id
 * @property int $trainer_profile_id
 * @property string $google_user_id
 * @property string $google_email
 * @property string $access_token
 * @property string|null $refresh_token
 * @property CarbonImmutable|null $token_expires_at
 * @property string|null $calendar_id
 * @property string|null $last_error
 * @property CarbonImmutable $connected_at
 * @property CarbonImmutable|null $last_synced_at
 * @property-read TrainerProfile $trainerProfile
 * @property-read Collection<int, CalendarEvent> $events
 */
#[Fillable([
    'google_user_id', 'google_email', 'access_token', 'refresh_token', 'token_expires_at',
    'calendar_id', 'last_error', 'connected_at', 'last_synced_at',
])]
class TrainerCalendarConnection extends Model
{
    /** The name of the calendar made on the trainer's Google account. */
    public const CALENDAR_NAME = 'MioPersonal';

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'access_token' => 'encrypted',
            'refresh_token' => 'encrypted',
            'token_expires_at' => 'datetime',
            'connected_at' => 'datetime',
            'last_synced_at' => 'datetime',
        ];
    }

    /** Whether the link is on, or Google said no and the trainer has to link again. */
    public function needsReconnect(): bool
    {
        return $this->last_error !== null;
    }

    /**
     * @return BelongsTo<TrainerProfile, $this>
     */
    public function trainerProfile(): BelongsTo
    {
        return $this->belongsTo(TrainerProfile::class);
    }

    /**
     * @return HasMany<CalendarEvent, $this>
     */
    public function events(): HasMany
    {
        return $this->hasMany(CalendarEvent::class);
    }
}
