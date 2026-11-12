<?php

namespace App\Models;

use App\Enums\Achievement;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A "Traguardo" the client reached. See App\Support\Achievements.
 *
 * @property int $id
 * @property int $user_id
 * @property Achievement $key
 * @property CarbonImmutable $earned_at
 * @property int|null $trainer_profile_id the trainer it was reached with
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property-read User $user
 * @property-read TrainerProfile|null $trainerProfile
 */
#[Fillable(['key', 'earned_at', 'trainer_profile_id'])]
class ClientAchievement extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'key' => Achievement::class,
            'earned_at' => 'datetime',
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
     * @return BelongsTo<TrainerProfile, $this>
     */
    public function trainerProfile(): BelongsTo
    {
        return $this->belongsTo(TrainerProfile::class);
    }
}
