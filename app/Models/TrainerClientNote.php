<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A dated note of the trainer on a client ("Note" in the card): private,
 * never shown to the client.
 *
 * @property int $id
 * @property int $trainer_client_id
 * @property string $body
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property-read TrainerClient $trainerClient
 */
#[Fillable(['body'])]
class TrainerClientNote extends Model
{
    public const BODY_MAX = 2000;

    /**
     * @return BelongsTo<TrainerClient, $this>
     */
    public function trainerClient(): BelongsTo
    {
        return $this->belongsTo(TrainerClient::class);
    }
}
