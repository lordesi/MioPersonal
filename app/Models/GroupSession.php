<?php

namespace App\Models;

use App\Enums\GroupSessionPlace;
use App\Enums\GroupSessionStatus;
use App\Enums\GroupSessionType;
use App\Enums\GymLinkStatus;
use App\Enums\RegistrationStatus;
use App\Observers\GroupSessionCalendarObserver;
use Carbon\CarbonImmutable;
use Database\Factories\GroupSessionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Notification as NotificationFacade;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * "Eventi": an appointment with N places, organized by trainers and gyms
 * (group_session_hosts), or one lesson of a gym's course on a day. A place
 * is confirmed at once while there are places left; no payment, the price is
 * paid at the place.
 *
 * Places left = capacity − offline_seats (taken outside the app) − the
 * clients registered here.
 *
 * @property int $id
 * @property string $slug
 * @property string|null $series_id the dates of "Ripeti ogni settimana"
 * @property GroupSessionType $type
 * @property string $title
 * @property string|null $description
 * @property string|null $cover_path on the public disk
 * @property int|null $discipline_id
 * @property int|null $city_id
 * @property GroupSessionPlace $place
 * @property int|null $gym_profile_id
 * @property string|null $address
 * @property CarbonImmutable $starts_at
 * @property CarbonImmutable $ends_at
 * @property int $capacity
 * @property int $offline_seats
 * @property int $price_cents
 * @property int|null $gym_course_lesson_id
 * @property CarbonImmutable|null $lesson_date
 * @property GroupSessionStatus $status
 * @property CarbonImmutable|null $cancelled_at
 * @property string|null $cancel_note
 * @property CarbonImmutable|null $hidden_at
 * @property int|null $created_by_user_id
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property int|null $registered_count withCount('activeRegistrations as registered_count')
 * @property-read City|null $city
 * @property-read Discipline|null $discipline
 * @property-read GymProfile|null $gymProfile
 * @property-read GymCourseLesson|null $lesson
 * @property-read Collection<int, GroupSessionHost> $hosts
 * @property-read Collection<int, GroupSessionRegistration> $registrations
 */
#[ObservedBy(GroupSessionCalendarObserver::class)]
#[Fillable([
    'series_id', 'type', 'title', 'description', 'cover_path', 'discipline_id', 'city_id', 'place',
    'gym_profile_id', 'address', 'starts_at', 'ends_at', 'capacity', 'offline_seats', 'price_cents',
    'gym_course_lesson_id', 'lesson_date', 'status', 'cancelled_at', 'cancel_note', 'hidden_at',
    'created_by_user_id',
])]
class GroupSession extends Model
{
    /** @use HasFactory<GroupSessionFactory> */
    use HasFactory;

    public const DISK = 'public';

    public const TITLE_MAX = 80;

    public const DESCRIPTION_MAX = 2000;

    public const MAX_CAPACITY = 500;

    /** Organizers of an event, the one who made it included. */
    public const MAX_HOSTS = 4;

    /** "Ripeti ogni settimana": dates of a series. */
    public const MAX_DATES = 12;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => GroupSessionType::class,
            'place' => GroupSessionPlace::class,
            'status' => GroupSessionStatus::class,
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'lesson_date' => 'date',
            'cancelled_at' => 'datetime',
            'hidden_at' => 'datetime',
            'capacity' => 'integer',
            'offline_seats' => 'integer',
            'price_cents' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        // "workshop-di-yoga-k3x9": readable and unique.
        static::creating(function (self $session) {
            if (blank($session->slug)) {
                $session->slug = Str::limit(Str::slug($session->title), 100, '').'-'.Str::lower(Str::random(6));
            }
        });
    }

    /**
     * The events people can find: published, not hidden, not lessons.
     *
     * @param  Builder<self>  $query
     */
    public function scopeListed(Builder $query): void
    {
        $query->where('status', GroupSessionStatus::Published)
            ->whereNull('hidden_at')
            ->whereNull('gym_course_lesson_id')
            ->where('type', '!=', GroupSessionType::Lesson)
            // At least one organizer still public.
            ->whereHas('hosts', fn (Builder $host) => $host->where('is_owner', true)->where(fn (Builder $owner) => $owner
                ->whereHas('trainerProfile', fn (Builder $trainer) => $trainer->approved())
                ->orWhereHas('gymProfile', fn (Builder $gym) => $gym->approved())));
    }

    /**
     * Not started yet.
     *
     * @param  Builder<self>  $query
     */
    public function scopeUpcoming(Builder $query): void
    {
        $query->where('starts_at', '>', now());
    }

    /**
     * Organized (accepted) by this trainer or this gym.
     *
     * @param  Builder<self>  $query
     */
    public function scopeHostedBy(Builder $query, TrainerProfile|GymProfile $profile): void
    {
        $column = $profile instanceof TrainerProfile ? 'trainer_profile_id' : 'gym_profile_id';

        $query->whereHas('hosts', fn (Builder $host) => $host->where($column, $profile->id)->where('status', GymLinkStatus::Accepted));
    }

    public function isLesson(): bool
    {
        return $this->gym_course_lesson_id !== null || $this->type === GroupSessionType::Lesson;
    }

    public function isCancelled(): bool
    {
        return $this->status === GroupSessionStatus::Cancelled;
    }

    public function hasStarted(): bool
    {
        return $this->starts_at->lte(now());
    }

    /** Places can be taken: on the calendar, not hidden, not started. */
    public function isOpen(): bool
    {
        return ! $this->isCancelled() && $this->hidden_at === null && ! $this->hasStarted();
    }

    public function registeredCount(): int
    {
        return $this->registered_count ?? $this->activeRegistrations()->count();
    }

    public function remainingSeats(): int
    {
        return max(0, $this->capacity - $this->offline_seats - $this->registeredCount());
    }

    public function coverUrl(): ?string
    {
        return $this->cover_path === null ? null : Storage::disk(self::DISK)->url($this->cover_path);
    }

    /** "Gratis", "15 €", "12,50 €". */
    public function priceLabel(): string
    {
        if ($this->price_cents === 0) {
            return 'Gratis';
        }

        $euros = $this->price_cents / 100;

        return (fmod($euros, 1.0) === 0.0 ? number_format($euros, 0, ',', '.') : number_format($euros, 2, ',', '.')).' €';
    }

    /** "Via Roma 1, Milano", the gym's address, or "Online". */
    public function placeLabel(): string
    {
        return match ($this->place) {
            GroupSessionPlace::Gym => $this->gymProfile !== null ? $this->gymProfile->name.' · '.$this->gymProfile->fullAddress() : 'In palestra',
            GroupSessionPlace::Address => trim(($this->address ?? '').($this->city !== null ? ', '.$this->city->name : ''), ', '),
            GroupSessionPlace::Online => 'Online',
        };
    }

    /** The accepted host of this user (their trainer profile or gym), if any. */
    public function hostOf(?User $user): ?GroupSessionHost
    {
        if ($user === null) {
            return null;
        }

        $trainerId = $user->trainerProfile?->id;
        $gymId = $user->gymProfile?->id;

        return $this->hosts->first(fn (GroupSessionHost $host) => $host->status === GymLinkStatus::Accepted
            && (($trainerId !== null && $host->trainer_profile_id === $trainerId) || ($gymId !== null && $host->gym_profile_id === $gymId)));
    }

    public function owner(): ?GroupSessionHost
    {
        return $this->hosts->firstWhere('is_owner', true);
    }

    /**
     * The organizers who said yes, the owner first.
     *
     * @return \Illuminate\Support\Collection<int, GroupSessionHost>
     */
    public function acceptedHosts(): \Illuminate\Support\Collection
    {
        return $this->hosts
            ->where('status', GymLinkStatus::Accepted)
            ->sortByDesc('is_owner')
            ->values()
            ->toBase();
    }

    /** Mail and push to the clients with a place here. */
    public function notifyRegistered(Notification $notification): void
    {
        $users = $this->activeRegistrations()->with('user')->get()->pluck('user')->filter();

        if ($users->isNotEmpty()) {
            NotificationFacade::send($users, $notification);
        }
    }

    /**
     * @return BelongsTo<City, $this>
     */
    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class);
    }

    /**
     * @return BelongsTo<Discipline, $this>
     */
    public function discipline(): BelongsTo
    {
        return $this->belongsTo(Discipline::class);
    }

    /**
     * @return BelongsTo<GymProfile, $this>
     */
    public function gymProfile(): BelongsTo
    {
        return $this->belongsTo(GymProfile::class);
    }

    /**
     * @return BelongsTo<GymCourseLesson, $this>
     */
    public function lesson(): BelongsTo
    {
        return $this->belongsTo(GymCourseLesson::class, 'gym_course_lesson_id');
    }

    /**
     * @return HasMany<GroupSessionHost, $this>
     */
    public function hosts(): HasMany
    {
        return $this->hasMany(GroupSessionHost::class);
    }

    /**
     * The people waiting for a place ("Avvisami se si libera").
     *
     * @return HasMany<WaitlistEntry, $this>
     */
    public function waitlist(): HasMany
    {
        return $this->hasMany(WaitlistEntry::class);
    }

    /**
     * @return HasMany<GroupSessionRegistration, $this>
     */
    public function registrations(): HasMany
    {
        return $this->hasMany(GroupSessionRegistration::class);
    }

    /**
     * @return HasMany<GroupSessionRegistration, $this>
     */
    public function activeRegistrations(): HasMany
    {
        return $this->registrations()->where('status', RegistrationStatus::Registered);
    }

    /**
     * The other dates of its series ("Ripeti ogni settimana"), this one included.
     *
     * @return Builder<self>
     */
    public function series(): Builder
    {
        return $this->series_id === null
            ? self::query()->whereKey($this->id)
            : self::query()->where('series_id', $this->series_id);
    }
}
