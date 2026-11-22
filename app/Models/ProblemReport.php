<?php

namespace App\Models;

use App\Enums\UserRole;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

/**
 * "Segnala un problema": sent by a logged-in user from the account menu or the
 * footer, read by the team in "Admin · Problemi segnalati". The page and the
 * device are added by the site; the screenshot is optional and private.
 *
 * @property int $id
 * @property int $user_id
 * @property string $role a UserRole value, when it was sent
 * @property string $message
 * @property string $page the path, without query string and tokens
 * @property string $device e.g. "iPhone · Safari"
 * @property string|null $viewport e.g. "390×844"
 * @property bool $installed sent from the installed app
 * @property string|null $screenshot_path on self::DISK
 * @property CarbonImmutable|null $resolved_at
 * @property int|null $resolved_by
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property-read User $user
 */
#[Fillable(['role', 'message', 'page', 'device', 'viewport', 'installed', 'screenshot_path'])]
class ProblemReport extends Model
{
    /** Private: the screenshot is opened only from the admin page. */
    public const DISK = 'local';

    public const FOLDER = 'problem-reports';

    public const MESSAGE_MAX = 2000;

    public const SCREENSHOT_MAX_KB = 10240;

    /** The privacy policy says so: then the report and its screenshot are deleted. */
    public const RETENTION_DAYS = 90;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'installed' => 'boolean',
            'resolved_at' => 'datetime',
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
    public function scopeOpen(Builder $query): void
    {
        $query->whereNull('resolved_at');
    }

    public function roleLabel(): string
    {
        return match (UserRole::tryFrom($this->role)) {
            UserRole::Client => 'Cliente',
            UserRole::Trainer => 'Trainer',
            UserRole::Gym => 'Palestra',
            UserRole::Admin => 'Admin',
            null => $this->role,
        };
    }

    /**
     * The reports and their screenshots, gone for good.
     *
     * @param  Builder<self>  $query
     */
    public static function purge(Builder $query): int
    {
        $count = 0;

        $query->chunkById(200, function ($reports) use (&$count) {
            $paths = $reports->pluck('screenshot_path')->filter()->values()->all();

            if ($paths !== []) {
                Storage::disk(self::DISK)->delete($paths);
            }

            $count += self::query()->whereKey($reports->modelKeys())->delete();
        });

        return $count;
    }
}
