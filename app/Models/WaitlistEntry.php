<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A client in line for a full event, or for a day a trainer is full.
 * See App\Actions\Waitlist\Waitlist.
 *
 * @property int $id
 * @property int $user_id
 * @property int|null $group_session_id
 * @property int|null $trainer_profile_id
 * @property CarbonImmutable|null $day Rome day (trainer's days only)
 * @property CarbonImmutable|null $notified_at told that something is free; the turn is kept for HOLD_HOURS
 * @property-read User $user
 * @property-read GroupSession|null $groupSession
 * @property-read TrainerProfile|null $trainerProfile
 */
#[Fillable(['user_id', 'group_session_id', 'trainer_profile_id', 'day', 'notified_at'])]
class WaitlistEntry extends Model
{
    /** Hours a person told about a free place has to take it, before the next one in line is told. */
    public const HOLD_HOURS = 3;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'day' => 'date',
            'notified_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<GroupSession, $this>
     */
    public function groupSession(): BelongsTo
    {
        return $this->belongsTo(GroupSession::class);
    }

    /**
     * @return BelongsTo<TrainerProfile, $this>
     */
    public function trainerProfile(): BelongsTo
    {
        return $this->belongsTo(TrainerProfile::class);
    }
}
