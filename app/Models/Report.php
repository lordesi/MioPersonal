<?php

namespace App\Models;

use App\Enums\ReportReason;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * "Segnala": a trainer profile, a gym profile or a review reported by a user,
 * checked by the team in "Admin · Segnalazioni".
 *
 * @property int $id
 * @property int|null $reporter_id
 * @property string $reportable_type
 * @property int $reportable_id
 * @property ReportReason $reason
 * @property string|null $details
 * @property CarbonImmutable|null $resolved_at
 * @property int|null $resolved_by
 * @property string|null $resolution "removed" or "dismissed"
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property-read User|null $reporter
 * @property-read TrainerProfile|GymProfile|Review|null $reportable
 */
#[Fillable(['reason', 'details'])]
class Report extends Model
{
    public const REMOVED = 'removed';

    public const DISMISSED = 'dismissed';

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'reason' => ReportReason::class,
            'resolved_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reporter_id');
    }

    /**
     * @return MorphTo<Model, $this>
     */
    public function reportable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * @param  Builder<self>  $query
     */
    public function scopeOpen(Builder $query): void
    {
        $query->whereNull('resolved_at');
    }
}
