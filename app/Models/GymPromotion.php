<?php

namespace App\Models;

use App\Support\TrainerSlots;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A promotion of a gym: public from starts_on to ends_on (Rome days, both
 * included; empty = no limit on that side). Either a promotional price or a
 * discount in percent.
 *
 * @property int $id
 * @property int $gym_profile_id
 * @property int|null $gym_plan_id
 * @property string $title
 * @property string|null $description
 * @property int|null $promo_price_cents
 * @property int|null $discount_percent
 * @property CarbonImmutable|null $starts_on
 * @property CarbonImmutable|null $ends_on
 * @property-read GymPlan|null $plan
 */
#[Fillable(['gym_plan_id', 'title', 'description', 'promo_price_cents', 'discount_percent', 'starts_on', 'ends_on'])]
class GymPromotion extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'promo_price_cents' => 'integer',
            'discount_percent' => 'integer',
            'starts_on' => 'immutable_date',
            'ends_on' => 'immutable_date',
        ];
    }

    /**
     * @return BelongsTo<GymPlan, $this>
     */
    public function plan(): BelongsTo
    {
        return $this->belongsTo(GymPlan::class, 'gym_plan_id');
    }

    /** Today's Rome date, "2026-11-10". */
    public static function today(): string
    {
        return CarbonImmutable::now(TrainerSlots::TIMEZONE)->toDateString();
    }

    /**
     * Public today. Checked at every request: nothing to switch on or off at midnight.
     *
     * @param  Builder<self>  $query
     */
    public function scopeActive(Builder $query): void
    {
        $today = self::today();

        // whereDate: SQLite (tests) keeps the dates with a time.
        $query->where(fn (Builder $start) => $start->whereNull('starts_on')->orWhereDate('starts_on', '<=', $today))
            ->where(fn (Builder $end) => $end->whereNull('ends_on')->orWhereDate('ends_on', '>=', $today));
    }

    public function isActive(): bool
    {
        $today = self::today();

        return ($this->starts_on === null || $this->starts_on->toDateString() <= $today)
            && ($this->ends_on === null || $this->ends_on->toDateString() >= $today);
    }

    /** 'active', 'upcoming' or 'expired', for the gym's list. */
    public function state(): string
    {
        $today = self::today();

        return match (true) {
            $this->ends_on !== null && $this->ends_on->toDateString() < $today => 'expired',
            $this->starts_on !== null && $this->starts_on->toDateString() > $today => 'upcoming',
            default => 'active',
        };
    }
}
