<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A payment the trainer wrote down by hand (cash, transfer…): a register
 * only, nothing goes through the site.
 *
 * @property int $id
 * @property int $trainer_client_id
 * @property int $amount_cents
 * @property CarbonImmutable $paid_on
 * @property string|null $note
 * @property-read TrainerClient $trainerClient
 */
#[Fillable(['amount_cents', 'paid_on', 'note'])]
class ClientPayment extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amount_cents' => 'integer',
            'paid_on' => 'date',
        ];
    }

    /**
     * @return BelongsTo<TrainerClient, $this>
     */
    public function trainerClient(): BelongsTo
    {
        return $this->belongsTo(TrainerClient::class);
    }
}
