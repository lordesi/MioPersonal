<?php

namespace App\Models;

use App\Support\SafeImage;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

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

    /** @param  'sm'|'md'|'lg'|null  $size  a lighter copy (SafeImage::VARIANTS); null = the original */
    public function url(?string $size = null): string
    {
        return SafeImage::url(self::DISK, $this->path, $size);
    }
}
