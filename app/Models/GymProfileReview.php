<?php

namespace App\Models;

use App\Enums\TrainerReviewDecision;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A decision of the team in "Admin · Verifica · Palestre", kept as history.
 * The decision reuses App\Enums\TrainerReviewDecision: same values.
 *
 * @property int $id
 * @property int $gym_profile_id
 * @property int|null $admin_id
 * @property TrainerReviewDecision $decision
 * @property list<string>|null $reasons
 * @property string|null $message_to_gym
 * @property string|null $internal_note
 * @property CarbonImmutable|null $created_at
 */
#[Fillable(['admin_id', 'decision', 'reasons', 'message_to_gym', 'internal_note'])]
class GymProfileReview extends Model
{
    public const UPDATED_AT = null;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'decision' => TrainerReviewDecision::class,
            'reasons' => 'array',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }
}
