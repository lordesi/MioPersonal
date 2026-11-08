<?php

namespace App\Models;

use App\Enums\GymLinkStatus;
use App\Enums\TrainerProfileStatus;
use App\Enums\UserRole;
use Carbon\CarbonImmutable;
use Database\Factories\GymProfileFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

/**
 * The public profile of a gym: one per gym user. Like the trainers', it shows
 * up in the site only once the team approves it (status "approved").
 *
 * The status reuses App\Enums\TrainerProfileStatus: same values, same meaning.
 *
 * @property int $id
 * @property int $user_id
 * @property string $slug
 * @property string $name
 * @property string $description
 * @property int $city_id
 * @property string $address
 * @property string|null $postal_code
 * @property list<string> $amenities App\Enums\GymAmenity values
 * @property string|null $opening_notes
 * @property string|null $phone
 * @property string|null $email
 * @property string|null $website
 * @property string|null $instagram the username only
 * @property TrainerProfileStatus $status
 * @property CarbonImmutable|null $status_changed_at
 * @property CarbonImmutable|null $approved_at
 * @property bool $visible_in_search
 * @property int|null $monthly_from_cents
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property-read User $user
 * @property-read City $city
 * @property-read GymPhoto|null $cover
 * @property-read Collection<int, GymAmenityDetail> $amenityDetails
 */
#[Fillable([
    'name', 'description', 'city_id', 'address', 'postal_code', 'amenities',
    'opening_notes', 'phone', 'email', 'website', 'instagram', 'visible_in_search',
])]
class GymProfile extends Model
{
    /** @use HasFactory<GymProfileFactory> */
    use HasFactory;

    /** Photos of the carousel besides the cover. */
    public const MAX_GALLERY_PHOTOS = 12;

    public const MAX_PLANS = 10;

    /** Promotions that can be public at the same time. */
    public const MAX_ACTIVE_PROMOTIONS = 5;

    /** "Corsi": at most this many courses. */
    public const MAX_COURSES = 30;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amenities' => 'array',
            'status' => TrainerProfileStatus::class,
            'status_changed_at' => 'datetime',
            'approved_at' => 'datetime',
            'visible_in_search' => 'boolean',
            'monthly_from_cents' => 'integer',
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
     * @return BelongsTo<City, $this>
     */
    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class);
    }

    /**
     * @return HasMany<GymPhoto, $this>
     */
    public function photos(): HasMany
    {
        return $this->hasMany(GymPhoto::class)->orderBy('sort')->orderBy('id');
    }

    /**
     * "Corsi": the courses with their weekly lessons, in the gym's order.
     *
     * @return HasMany<GymCourse, $this>
     */
    public function courses(): HasMany
    {
        return $this->hasMany(GymCourse::class)->orderBy('sort')->orderBy('id');
    }

    /**
     * "Servizi" told better: description and photo of the ticked services.
     *
     * @return HasMany<GymAmenityDetail, $this>
     */
    public function amenityDetails(): HasMany
    {
        return $this->hasMany(GymAmenityDetail::class);
    }

    /**
     * The big photo on top of the profile and on the cards.
     *
     * @return HasOne<GymPhoto, $this>
     */
    public function cover(): HasOne
    {
        return $this->hasOne(GymPhoto::class)->where('is_cover', true);
    }

    /**
     * @return HasMany<GymPhoto, $this>
     */
    public function galleryPhotos(): HasMany
    {
        return $this->hasMany(GymPhoto::class)->where('is_cover', false)->orderBy('sort')->orderBy('id');
    }

    /**
     * @return HasMany<GymOpeningHour, $this>
     */
    public function openingHours(): HasMany
    {
        return $this->hasMany(GymOpeningHour::class)->orderBy('weekday')->orderBy('opens_at');
    }

    /**
     * @return HasMany<GymPlan, $this>
     */
    public function plans(): HasMany
    {
        return $this->hasMany(GymPlan::class)->orderBy('sort')->orderBy('id');
    }

    /**
     * The plans shown on the profile.
     *
     * @return HasMany<GymPlan, $this>
     */
    public function activePlans(): HasMany
    {
        return $this->plans()->where('is_active', true);
    }

    /**
     * @return HasMany<GymPromotion, $this>
     */
    public function promotions(): HasMany
    {
        return $this->hasMany(GymPromotion::class)->orderByDesc('starts_on')->orderByDesc('id');
    }

    /**
     * The promotions public today (Rome day).
     *
     * @return HasMany<GymPromotion, $this>
     */
    public function activePromotions(): HasMany
    {
        return $this->hasMany(GymPromotion::class)->active()->orderBy('ends_on')->orderBy('id');
    }

    /**
     * The team's decisions, newest first.
     *
     * @return HasMany<GymProfileReview, $this>
     */
    public function decisions(): HasMany
    {
        return $this->hasMany(GymProfileReview::class)->latest('created_at')->latest('id');
    }

    /**
     * Every request and invitation, whatever the status.
     *
     * @return HasMany<GymTrainerLink, $this>
     */
    public function links(): HasMany
    {
        return $this->hasMany(GymTrainerLink::class);
    }

    /**
     * The trainers who work here: both sides agreed.
     *
     * @return BelongsToMany<TrainerProfile, $this>
     */
    public function trainers(): BelongsToMany
    {
        return $this->belongsToMany(TrainerProfile::class, 'gym_trainer')
            ->wherePivot('status', GymLinkStatus::Accepted->value)
            ->withPivot('id')
            ->withTimestamps();
    }

    /**
     * Approved, switched on in "Visibile nella ricerca", owner active.
     *
     * @param  Builder<self>  $query
     */
    public function scopePublished(Builder $query): void
    {
        // Qualified: through gym_trainer, the pivot has a `status` too.
        $query->where($query->qualifyColumn('status'), TrainerProfileStatus::Approved)
            ->where($query->qualifyColumn('visible_in_search'), true)
            ->whereHas('user', fn (Builder $user) => $user->active());
    }

    /**
     * Approved and the owner active: it can be linked to trainers even when
     * hidden from the search.
     *
     * @param  Builder<self>  $query
     */
    public function scopeApproved(Builder $query): void
    {
        $query->where($query->qualifyColumn('status'), TrainerProfileStatus::Approved)
            ->whereHas('user', fn (Builder $user) => $user->active());
    }

    public function isApproved(): bool
    {
        return $this->status === TrainerProfileStatus::Approved;
    }

    /** Same rules as TrainerProfile::isViewableBy(). */
    public function isViewableBy(?User $user): bool
    {
        if ($user?->role === UserRole::Admin) {
            return true;
        }

        if (! $this->ownerIsActive()) {
            return false;
        }

        return $this->isApproved() || $user?->id === $this->user_id;
    }

    public function ownerIsActive(): bool
    {
        return $this->user->suspended_at === null && $this->user->deletion_scheduled_at === null;
    }

    public function instagramUrl(): string
    {
        return "https://www.instagram.com/{$this->instagram}/";
    }

    /** "Via Roma 1, 20121 Milano". */
    public function fullAddress(): string
    {
        return trim($this->address.', '.trim(($this->postal_code ?? '').' '.$this->city->name));
    }

    /** "Apri in Google Maps": a search by name and address, no coordinates needed. */
    public function googleMapsUrl(): string
    {
        return 'https://www.google.com/maps/search/?api=1&query='.rawurlencode("{$this->name}, {$this->fullAddress()}");
    }

    /** The cheapest active plan over one month, for the cards and the price filter. */
    public function refreshMonthlyFrom(): void
    {
        $cheapest = $this->activePlans()->get()
            ->map(fn (GymPlan $plan) => $plan->monthlyCents())
            ->filter(fn (?int $cents) => $cents !== null)
            ->min();

        $this->forceFill(['monthly_from_cents' => $cheapest])->save();
    }

    /** "fitlab-milano", then "fitlab-milano-2"… if it is taken. */
    public static function uniqueSlug(string $name, ?string $city = null): string
    {
        // "FitLab" in Milano → "fitlab-milano"; "Iron Box Torino" stays "iron-box-torino".
        $citySlug = Str::slug($city ?? '');
        $nameSlug = Str::slug($name);
        $base = ($citySlug === '' || str_contains("-{$nameSlug}-", "-{$citySlug}-") ? $nameSlug : "{$nameSlug}-{$citySlug}") ?: 'palestra';
        $slug = $base;

        for ($number = 2; self::where('slug', $slug)->exists(); $number++) {
            $slug = "{$base}-{$number}";
        }

        return $slug;
    }
}
