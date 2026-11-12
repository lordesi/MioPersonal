<?php

namespace App\Models;

use App\Enums\ActivityKind;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * "Segna un allenamento": a training the client did on their own, in the
 * "Panoramica" diary. See App\Support\ClientProgress.
 *
 * @property int $id
 * @property int $user_id
 * @property string $done_on Rome day, "2026-11-12" (no date cast: compared as text)
 * @property ActivityKind $kind
 * @property int|null $minutes
 * @property int|null $effort 1 leggero, 2 giusto, 3 intenso
 * @property string|null $note
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property-read User $user
 */
#[Fillable(['done_on', 'kind', 'minutes', 'effort', 'note'])]
class ActivityLog extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'kind' => ActivityKind::class,
            'minutes' => 'integer',
            'effort' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
