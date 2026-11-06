<?php

namespace App\Models;

use App\Enums\GymPlanPeriod;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A plan of a gym ("Abbonamento mensile", "10 ingressi"): shown on the
 * profile, bought at the gym. Prices in whole cents.
 *
 * @property int $id
 * @property int $gym_profile_id
 * @property string $name
 * @property GymPlanPeriod $period
 * @property int|null $entries_count only for GymPlanPeriod::Entries
 * @property int $price_cents
 * @property list<string>|null $features "Cosa include"
 * @property string|null $note
 * @property int $sort
 * @property bool $is_active
 * @property-read GymProfile $gymProfile
 */
#[Fillable(['name', 'period', 'entries_count', 'price_cents', 'features', 'note', 'sort', 'is_active'])]
class GymPlan extends Model
{
    /** "Cosa include": lines per plan. */
    public const MAX_FEATURES = 8;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'period' => GymPlanPeriod::class,
            'entries_count' => 'integer',
            'price_cents' => 'integer',
            'features' => 'array',
            'sort' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<GymProfile, $this>
     */
    public function gymProfile(): BelongsTo
    {
        return $this->belongsTo(GymProfile::class);
    }

    public function monthlyCents(): ?int
    {
        return $this->period->monthlyCents($this->price_cents);
    }

    /** "/mese", "per 10 ingressi". */
    public function suffix(): string
    {
        return $this->period->suffix($this->entries_count);
    }
}
