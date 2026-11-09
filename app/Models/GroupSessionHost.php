<?php

namespace App\Models;

use App\Enums\GymLinkStatus;
use App\Observers\GroupSessionCalendarObserver;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * An organizer of an event: a trainer or a gym. The one who made it
 * (is_owner) is accepted at once; the others are invited and say yes or no,
 * as the trainers of a gym (GymTrainerLink).
 *
 * @property int $id
 * @property int $group_session_id
 * @property int|null $trainer_profile_id
 * @property int|null $gym_profile_id
 * @property bool $is_owner
 * @property GymLinkStatus $status
 * @property CarbonImmutable|null $responded_at
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property-read GroupSession $groupSession
 * @property-read TrainerProfile|null $trainerProfile
 * @property-read GymProfile|null $gymProfile
 */
#[ObservedBy(GroupSessionCalendarObserver::class)]
#[Fillable(['trainer_profile_id', 'gym_profile_id', 'is_owner', 'status', 'responded_at'])]
class GroupSessionHost extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_owner' => 'boolean',
            'status' => GymLinkStatus::class,
            'responded_at' => 'datetime',
        ];
    }

    public function isAccepted(): bool
    {
        return $this->status === GymLinkStatus::Accepted;
    }

    public function isPending(): bool
    {
        return $this->status === GymLinkStatus::Pending;
    }

    /** The trainer's or the gym's name. */
    public function name(): string
    {
        return $this->trainerProfile?->user->name ?? $this->gymProfile->name ?? '';
    }

    /** Its public page, while it's approved. */
    public function href(): ?string
    {
        if ($this->trainerProfile !== null) {
            return $this->trainerProfile->isApproved() ? route('trainers.show', $this->trainerProfile->slug, false) : null;
        }

        return $this->gymProfile?->isApproved() ? route('gyms.show', $this->gymProfile->slug, false) : null;
    }

    /** Who receives its emails. */
    public function user(): ?User
    {
        return $this->trainerProfile->user ?? $this->gymProfile?->user;
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

    /**
     * @return BelongsTo<GymProfile, $this>
     */
    public function gymProfile(): BelongsTo
    {
        return $this->belongsTo(GymProfile::class);
    }
}
