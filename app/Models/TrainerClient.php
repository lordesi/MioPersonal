<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

/**
 * A client in the list of a trainer: someone who booked on the site, or
 * someone the trainer added by hand. The notes, the goal and the payments
 * are the trainer's own and are never shown to the client; the shared note
 * is for the client ("Panoramica"). The client's progress reaches the
 * trainer only while `progress_shared_at` is set, by the client.
 *
 * @property int $id
 * @property int $trainer_profile_id
 * @property int|null $user_id
 * @property string $name
 * @property string|null $email
 * @property string|null $phone
 * @property string|null $goal
 * @property string|null $private_notes
 * @property string $invite_token
 * @property CarbonImmutable|null $progress_shared_at
 * @property string|null $shared_note
 * @property CarbonImmutable|null $shared_note_at
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property-read TrainerProfile $trainerProfile
 * @property-read User|null $user
 * @property-read Collection<int, ClientPayment> $payments
 */
#[Fillable(['user_id', 'name', 'email', 'phone', 'goal', 'private_notes', 'shared_note', 'shared_note_at'])]
class TrainerClient extends Model
{
    public const NAME_MAX = 100;

    public const NOTES_MAX = 2000;

    /** "Nota per il cliente". */
    public const SHARED_NOTE_MAX = 500;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'progress_shared_at' => 'datetime',
            'shared_note_at' => 'datetime',
        ];
    }

    /** The client shares "Panoramica" with this trainer. */
    public function sharesProgress(): bool
    {
        return $this->user_id !== null && $this->progress_shared_at !== null;
    }

    protected static function booted(): void
    {
        static::creating(function (self $client) {
            $client->invite_token ??= Str::random(24);
        });
    }

    /** Not signed up yet: the contacts are the ones the trainer wrote. */
    public function isRegistered(): bool
    {
        return $this->user_id !== null;
    }

    /**
     * Not signed up with the personal link yet.
     *
     * @param  Builder<self>  $query
     */
    public function scopeUnclaimed(Builder $query): void
    {
        $query->whereNull('user_id');
    }

    /**
     * @return BelongsTo<TrainerProfile, $this>
     */
    public function trainerProfile(): BelongsTo
    {
        return $this->belongsTo(TrainerProfile::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return HasMany<ClientPayment, $this>
     */
    public function payments(): HasMany
    {
        return $this->hasMany(ClientPayment::class)->orderByDesc('paid_on')->orderByDesc('id');
    }
}
