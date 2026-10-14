<?php

namespace App\Models;

use Database\Factories\DisciplineFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Carbon;

/**
 * One list for the whole app: search, trainer registration, admin.
 *
 * @property int $id
 * @property string $name
 * @property string $slug
 * @property int $sort
 * @property bool $is_active
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read int|null $trainer_profiles_count
 */
#[Fillable(['name', 'slug', 'sort', 'is_active'])]
class Discipline extends Model
{
    /** @use HasFactory<DisciplineFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'sort' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /**
     * The trainers who teach it.
     *
     * @return BelongsToMany<TrainerProfile, $this>
     */
    public function trainerProfiles(): BelongsToMany
    {
        return $this->belongsToMany(TrainerProfile::class, 'trainer_profile_discipline');
    }

    /**
     * @param  Builder<self>  $query
     */
    public function scopeActive(Builder $query): void
    {
        $query->where('is_active', true);
    }
}
