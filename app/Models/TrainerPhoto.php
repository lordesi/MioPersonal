<?php

namespace App\Models;

use App\Support\SafeImage;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

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

    /** @param  'sm'|'md'|'lg'|null  $size  a lighter copy (SafeImage::VARIANTS); null = the original */
    public function url(?string $size = null): string
    {
        return SafeImage::url(self::DISK, $this->path, $size);
    }
}
