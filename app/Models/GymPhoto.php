<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

/**
 * A photo of a gym, on the public disk: the cover or one of the gallery.
 *
 * @property int $id
 * @property int $gym_profile_id
 * @property string $path
 * @property bool $is_cover
 * @property int $sort
 */
#[Fillable(['path', 'is_cover', 'sort'])]
class GymPhoto extends Model
{
    public const DISK = 'public';

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_cover' => 'boolean',
            'sort' => 'integer',
        ];
    }

    public function url(): string
    {
        return Storage::disk(self::DISK)->url($this->path);
    }
}
