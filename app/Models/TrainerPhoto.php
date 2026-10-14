<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

/**
 * A photo of the profile, on the public disk.
 *
 * @property int $id
 * @property int $trainer_profile_id
 * @property string $path
 * @property string|null $caption
 * @property bool $is_portrait
 * @property int $sort
 */
#[Fillable(['path', 'caption', 'is_portrait', 'sort'])]
class TrainerPhoto extends Model
{
    public const DISK = 'public';

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_portrait' => 'boolean',
            'sort' => 'integer',
        ];
    }

    public function url(): string
    {
        return Storage::disk(self::DISK)->url($this->path);
    }
}
