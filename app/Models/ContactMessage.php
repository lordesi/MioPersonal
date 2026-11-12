<?php

namespace App\Models;

use App\Http\Requests\ContactRequest;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A message of the Contatti page, read by the team in "Admin · Messaggi".
 *
 * @property int $id
 * @property int|null $user_id who was logged in when writing
 * @property string $role a key of ContactRequest::ROLES
 * @property string $topic a key of ContactRequest::TOPICS
 * @property string $name
 * @property string $email
 * @property string $message
 * @property CarbonImmutable|null $read_at
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property-read User|null $user
 */
#[Fillable(['user_id', 'role', 'topic', 'name', 'email', 'message'])]
class ContactMessage extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
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
     * @param  Builder<self>  $query
     */
    public function scopeUnread(Builder $query): void
    {
        $query->whereNull('read_at');
    }

    public function roleLabel(): string
    {
        return ContactRequest::ROLES[$this->role] ?? $this->role;
    }

    public function topicLabel(): string
    {
        return ContactRequest::TOPICS[$this->topic] ?? $this->topic;
    }
}
