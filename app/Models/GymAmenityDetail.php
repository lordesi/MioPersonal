<?php

namespace App\Models;

use App\Enums\GymAmenity;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

/**
 * A service of a gym told better ("Servizi" of the gym area): a description
 * and a photo, on the public profile. Only for a service the gym ticked.
 *
 * @property int $id
 * @property int $gym_profile_id
 * @property GymAmenity $amenity
 * @property string|null $description
 * @property string|null $photo_path on the disk of GymPhoto
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property-read GymProfile $gymProfile
 */
#[Fillable(['amenity', 'description', 'photo_path'])]
class GymAmenityDetail extends Model
{
    public const DESCRIPTION_MAX = 500;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amenity' => GymAmenity::class,
        ];
    }

    public function photoUrl(): ?string
    {
        return $this->photo_path === null ? null : Storage::disk(GymPhoto::DISK)->url($this->photo_path);
    }

    /** Nothing to show: no text and no photo. */
    public function isEmpty(): bool
    {
        return blank($this->description) && $this->photo_path === null;
    }

    /**
     * @return BelongsTo<GymProfile, $this>
     */
    public function gymProfile(): BelongsTo
    {
        return $this->belongsTo(GymProfile::class);
    }
}
