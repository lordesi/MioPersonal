<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

/**
 * A line of the "Registro attività": what an admin did, e.g. "Profilo di
 * Marco Rossi approvato". Written with AdminActivity::log(), never changed.
 *
 * @property int $id
 * @property int|null $admin_id null once that admin's account is deleted
 * @property string $action e.g. "trainer.approved", "review.hidden"
 * @property string|null $subject_type
 * @property int|null $subject_id
 * @property string $description
 * @property CarbonImmutable $created_at
 * @property-read User|null $admin
 */
#[Fillable(['admin_id', 'action', 'subject_type', 'subject_id', 'description'])]
class AdminActivity extends Model
{
    protected $table = 'admin_activity_log';

    public const UPDATED_AT = null;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
        ];
    }

    /** Records an action of the logged-in admin. */
    public static function log(string $action, ?Model $subject, string $description): self
    {
        return self::create([
            'admin_id' => Auth::id(),
            'action' => $action,
            'subject_type' => $subject?->getMorphClass(),
            'subject_id' => $subject?->getKey(),
            'description' => Str::limit($description, 250),
        ]);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    /**
     * For the pages: who, what, when.
     *
     * @return array{id: int, adminName: string, action: string, description: string, createdAt: string}
     */
    public function toRow(): array
    {
        return [
            'id' => $this->id,
            'adminName' => $this->admin->name ?? 'Admin eliminato',
            'action' => $this->action,
            'description' => $this->description,
            'createdAt' => $this->created_at->toIso8601ZuluString(),
        ];
    }
}
