<?php

namespace App\Models;

use App\Enums\GymLinkSide;
use App\Enums\GymLinkStatus;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A trainer in a gym: one side asks (initiated_by), the other accepts or
 * declines. Only App\Actions\Gym\GymLinks changes it.
 *
 * @property int $id
 * @property int $gym_profile_id
 * @property int $trainer_profile_id
 * @property GymLinkStatus $status
 * @property GymLinkSide $initiated_by
 * @property string|null $message
 * @property CarbonImmutable|null $responded_at
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property-read GymProfile $gymProfile
 * @property-read TrainerProfile $trainerProfile
 */
#[Fillable(['status', 'initiated_by', 'message', 'responded_at'])]
class GymTrainerLink extends Model
{
    protected $table = 'gym_trainer';

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => GymLinkStatus::class,
            'initiated_by' => GymLinkSide::class,
            'responded_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<GymProfile, $this>
     */
    public function gymProfile(): BelongsTo
    {
        return $this->belongsTo(GymProfile::class);
    }

    /**
     * @return BelongsTo<TrainerProfile, $this>
     */
    public function trainerProfile(): BelongsTo
    {
        return $this->belongsTo(TrainerProfile::class);
    }

    public function isPending(): bool
    {
        return $this->status === GymLinkStatus::Pending;
    }

    /** Waiting for $side to answer. */
    public function awaits(GymLinkSide $side): bool
    {
        return $this->isPending() && $this->initiated_by !== $side;
    }
}
