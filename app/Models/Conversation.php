<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * "Messaggi" between a trainer and one of their registered clients: made
 * with the first message. The attachments live in `chat/{id}` on the
 * private disk and go with the conversation (see purge()).
 *
 * @property int $id
 * @property int $trainer_client_id
 * @property CarbonImmutable|null $last_message_at
 * @property CarbonImmutable|null $trainer_read_at
 * @property CarbonImmutable|null $client_read_at
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property-read TrainerClient $trainerClient
 * @property-read Collection<int, Message> $messages
 * @property-read Message|null $latestMessage
 */
#[Fillable(['trainer_client_id'])]
class Conversation extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'last_message_at' => 'datetime',
            'trainer_read_at' => 'datetime',
            'client_read_at' => 'datetime',
        ];
    }

    /** The folder of the attachments on Message::DISK. */
    public function folder(): string
    {
        return "chat/{$this->id}";
    }

    /** New messages from the other person since this user last opened it. */
    public function unreadFor(User $user): bool
    {
        if ($this->last_message_at === null) {
            return false;
        }

        $read = $this->isTrainer($user) ? $this->trainer_read_at : $this->client_read_at;

        return $read === null || $read->lt($this->last_message_at);
    }

    public function isTrainer(User $user): bool
    {
        return $this->trainerClient->trainerProfile->user_id === $user->id;
    }

    public function markReadBy(User $user): void
    {
        $this->forceFill([$this->isTrainer($user) ? 'trainer_read_at' : 'client_read_at' => now()])->save();
    }

    /**
     * Deletes the conversations with their attachments, once the deletion is saved.
     *
     * @param  iterable<int, self>  $conversations
     */
    public static function purge(iterable $conversations): void
    {
        foreach ($conversations as $conversation) {
            $folder = $conversation->folder();
            $conversation->delete();
            DB::afterCommit(fn () => Storage::disk(Message::DISK)->deleteDirectory($folder));
        }
    }

    /**
     * @return BelongsTo<TrainerClient, $this>
     */
    public function trainerClient(): BelongsTo
    {
        return $this->belongsTo(TrainerClient::class);
    }

    /**
     * @return HasMany<Message, $this>
     */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    /**
     * The preview in the list.
     *
     * @return HasOne<Message, $this>
     */
    public function latestMessage(): HasOne
    {
        return $this->hasOne(Message::class)->latestOfMany();
    }
}
