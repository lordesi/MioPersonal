<?php

namespace App\Models;

use App\Enums\TrainerExperience;
use App\Enums\TrainerProfileStatus;
use App\Enums\UserRole;
use Carbon\CarbonImmutable;
use Database\Factories\TrainerProfileFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

/**
 * The public profile of a trainer: one per trainer user. It shows up in the
 * site only once the team approves it (status "approved").
 *
 * @property int $id
 * @property int $user_id
 * @property string $slug
 * @property string $headline
 * @property string $bio
 * @property TrainerExperience $experience
 * @property int|null $city_id
 * @property TrainerProfileStatus $status
 * @property CarbonImmutable|null $status_changed_at
 * @property CarbonImmutable|null $approved_at
 * @property bool $visible_in_search
 * @property bool $accepts_new_clients
 * @property CarbonImmutable|null $paused_until
 * @property int $notice_hours
 * @property int $booking_window_days
 * @property int $break_minutes
 * @property int|null $max_sessions_per_day null = "Nessun limite"
 * @property int $free_cancellation_hours
 * @property int $confirm_hours
 * @property bool $auto_confirm
 * @property list<int> $session_minutes the bookable durations, e.g. [60, 120]
 * @property bool $show_phone
 * @property bool $show_email
 * @property bool $show_whatsapp
 * @property string|null $arrival_notes
 * @property bool $trains_online
 * @property bool $trains_in_person
 * @property int|null $price_from_cents
 * @property CarbonImmutable|null $next_free_slot_at
 * @property int $rating_count
 * @property int $rating_sum
 * @property int|null $response_minutes
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property-read User $user
 * @property-read City|null $city
 */
#[Fillable([
    'headline', 'bio', 'experience', 'city_id',
    'visible_in_search', 'accepts_new_clients', 'paused_until',
    'notice_hours', 'booking_window_days', 'break_minutes',
    'max_sessions_per_day', 'free_cancellation_hours', 'auto_confirm',
    'session_minutes',
    'show_phone', 'show_email', 'show_whatsapp', 'arrival_notes',
])]
class TrainerProfile extends Model
{
    /** @use HasFactory<TrainerProfileFactory> */
    use HasFactory;

    public const MAX_DISCIPLINES = 5;

    /** "Durate prenotabili": 30 min, 1 ora, 1 ora e mezza, 2 ore, 2 ore e mezza, 3 ore. */
    public const SESSION_MINUTES = [30, 60, 90, 120, 150, 180];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'experience' => TrainerExperience::class,
            'status' => TrainerProfileStatus::class,
            'status_changed_at' => 'datetime',
            'approved_at' => 'datetime',
            'visible_in_search' => 'boolean',
            'accepts_new_clients' => 'boolean',
            'paused_until' => 'datetime',
            // Forms with files send numbers as text: always read them as integers.
            'notice_hours' => 'integer',
            'booking_window_days' => 'integer',
            'break_minutes' => 'integer',
            'max_sessions_per_day' => 'integer',
            'free_cancellation_hours' => 'integer',
            'confirm_hours' => 'integer',
            'auto_confirm' => 'boolean',
            'session_minutes' => 'array',
            'show_phone' => 'boolean',
            'show_email' => 'boolean',
            'show_whatsapp' => 'boolean',
            'trains_online' => 'boolean',
            'trains_in_person' => 'boolean',
            'price_from_cents' => 'integer',
            'next_free_slot_at' => 'datetime',
            'rating_count' => 'integer',
            'rating_sum' => 'integer',
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
     * The main city (empty for online-only trainers).
     *
     * @return BelongsTo<City, $this>
     */
    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class);
    }

    /**
     * In the trainer's order.
     *
     * @return BelongsToMany<Discipline, $this>
     */
    public function disciplines(): BelongsToMany
    {
        return $this->belongsToMany(Discipline::class, 'trainer_profile_discipline')
            ->withPivot('sort')
            ->orderByPivot('sort');
    }

    /**
     * The other cities where the trainer goes (home and park sessions).
     *
     * @return BelongsToMany<City, $this>
     */
    public function otherCities(): BelongsToMany
    {
        return $this->belongsToMany(City::class, 'trainer_profile_city')->orderBy('name');
    }

    /**
     * @return HasMany<TrainerPlace, $this>
     */
    public function places(): HasMany
    {
        return $this->hasMany(TrainerPlace::class)->orderBy('sort');
    }

    /**
     * @return HasMany<Service, $this>
     */
    public function services(): HasMany
    {
        return $this->hasMany(Service::class)->orderBy('sort');
    }

    /**
     * @return HasMany<TrainerPhoto, $this>
     */
    public function photos(): HasMany
    {
        return $this->hasMany(TrainerPhoto::class)->orderBy('sort');
    }

    /**
     * The profile photo.
     *
     * @return HasOne<TrainerPhoto, $this>
     */
    public function portrait(): HasOne
    {
        return $this->hasOne(TrainerPhoto::class)->where('is_portrait', true);
    }

    /**
     * @return HasMany<TrainerDocument, $this>
     */
    public function documents(): HasMany
    {
        return $this->hasMany(TrainerDocument::class)->orderBy('sort');
    }

    /**
     * The team's decisions, newest first.
     *
     * @return HasMany<TrainerProfileReview, $this>
     */
    public function decisions(): HasMany
    {
        return $this->hasMany(TrainerProfileReview::class)->latest('created_at')->latest('id');
    }

    /**
     * @return HasMany<TrainerWorkingHour, $this>
     */
    public function workingHours(): HasMany
    {
        return $this->hasMany(TrainerWorkingHour::class)->orderBy('weekday')->orderBy('starts_at');
    }

    /**
     * @return HasMany<Booking, $this>
     */
    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    /**
     * Approved and switched on in "Visibile nella ricerca": search and home.
     * A paused profile still shows up: it just has no free slots.
     *
     * @param  Builder<self>  $query
     */
    public function scopePublished(Builder $query): void
    {
        $query->where('status', TrainerProfileStatus::Approved)->where('visible_in_search', true);
    }

    public function isApproved(): bool
    {
        return $this->status === TrainerProfileStatus::Approved;
    }

    /**
     * The public page: anyone once approved (even if hidden from the search,
     * it stays reachable with the link). Before that, only its trainer and the team.
     */
    public function isViewableBy(?User $user): bool
    {
        return $this->isApproved()
            || $user?->id === $this->user_id
            || $user?->role === UserRole::Admin;
    }

    /** Average rating with one decimal, null without reviews ("Nuovo"). */
    public function rating(): ?float
    {
        return $this->rating_count > 0 ? round($this->rating_sum / $this->rating_count, 1) : null;
    }

    /** "giulia-rossi", then "giulia-rossi-2"… if it is taken. */
    public static function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'trainer';
        $slug = $base;

        for ($number = 2; self::where('slug', $slug)->exists(); $number++) {
            $slug = "{$base}-{$number}";
        }

        return $slug;
    }
}
