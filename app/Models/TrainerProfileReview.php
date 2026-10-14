<?php

namespace App\Models;

use App\Enums\TrainerReviewDecision;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A decision of the team in "Admin · Verifica", kept as history.
 *
 * @property int $id
 * @property int $trainer_profile_id
 * @property int|null $admin_id
 * @property TrainerReviewDecision $decision
 * @property list<string>|null $reasons
 * @property string|null $message_to_trainer
 * @property string|null $internal_note
 * @property CarbonImmutable|null $created_at
 */
#[Fillable(['admin_id', 'decision', 'reasons', 'message_to_trainer', 'internal_note'])]
class TrainerProfileReview extends Model
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
