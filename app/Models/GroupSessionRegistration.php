<?php

namespace App\Models;

use App\Enums\RegistrationStatus;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A client's place in an event. One per client: given back and taken again,
 * the same row.
 *
 * @property int $id
 * @property int $group_session_id
 * @property int $user_id
 * @property RegistrationStatus $status
 * @property CarbonImmutable|null $reminded_day_before_at
 * @property CarbonImmutable|null $reminded_soon_at
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property-read GroupSession $groupSession
 * @property-read User $user
 */
#[Fillable(['user_id', 'status', 'reminded_day_before_at', 'reminded_soon_at'])]
class GroupSessionRegistration extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => RegistrationStatus::class,
            'reminded_day_before_at' => 'datetime',
            'reminded_soon_at' => 'datetime',
        ];
    }

    public function isActive(): bool
    {
        return $this->status === RegistrationStatus::Registered;
    }

    /**
     * @return BelongsTo<GroupSession, $this>
     */
    public function groupSession(): BelongsTo
    {
        return $this->belongsTo(GroupSession::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
