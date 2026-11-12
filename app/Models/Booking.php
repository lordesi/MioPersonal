<?php

namespace App\Models;

use App\Enums\BookingActor;
use App\Enums\BookingGuestStatus;
use App\Enums\BookingStatus;
use App\Notifications\BookingConfirmed;
use App\Observers\BookingCalendarObserver;
use App\Observers\BookingWaitlistObserver;
use Carbon\CarbonImmutable;
use Database\Factories\BookingFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Notification as NotificationFacade;
use Illuminate\Support\Str;

/**
 * A session a client asked a trainer for (see docs/database/analisi.md §3.6).
 * Name, price and place are copied when booking: later changes of the
 * service don't touch it.
 *
 * @property int $id
 * @property int|null $client_id null once the client deleted the account, or for someone without an account (`trainer_client_id`)
 * @property int|null $trainer_client_id "Aggiungi seduta": the person of the trainer's list ("Clienti")
 * @property BookingActor $requested_by who asked: the client ("Prenota") or the trainer ("Aggiungi seduta")
 * @property int $trainer_profile_id
 * @property int|null $service_id
 * @property int|null $client_package_id the package this session buys or uses
 * @property int|null $booking_series_id the "sedute fisse" rule that made it (or that it started)
 * @property bool $repeat_weekly "Ripeti ogni settimana": the client asked for "sedute fisse"
 * @property CarbonImmutable $starts_at
 * @property CarbonImmutable $ends_at
 * @property CarbonImmutable $blocked_until end + the trainer's break
 * @property string $service_name
 * @property int $price_cents the total, for all the `people`
 * @property int $people "Invita un amico": who comes, the booker included
 * @property string|null $invite_token the link for the friends, when people > 1
 * @property string $place_label
 * @property BookingStatus $status
 * @property CarbonImmutable|null $expires_at
 * @property CarbonImmutable|null $confirmed_at
 * @property CarbonImmutable|null $cancelled_at
 * @property BookingActor|null $cancelled_by
 * @property CarbonImmutable|null $no_show_at set by the trainer: the client didn't come
 * @property string|null $client_note
 * @property string|null $cancel_note the trainer's message to the client when cancelling
 * @property CarbonImmutable|null $proposed_starts_at "Sposta": the new start the trainer proposes
 * @property CarbonImmutable|null $proposal_expires_at after this the proposal lapses and the old time holds
 * @property CarbonImmutable|null $reminded_day_before_at the day-before reminder was handled (SendSessionReminders)
 * @property CarbonImmutable|null $reminded_soon_at the reminder 2 hours before was handled
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property-read User|null $client
 * @property-read TrainerClient|null $trainerClient
 * @property-read TrainerProfile $trainerProfile
 * @property-read ClientPackage|null $clientPackage
 * @property-read \Illuminate\Database\Eloquent\Collection<int, BookingGuest> $guests
 */
#[ObservedBy([BookingCalendarObserver::class, BookingWaitlistObserver::class])]
#[Fillable([
    'client_id', 'trainer_client_id', 'requested_by', 'trainer_profile_id', 'service_id', 'client_package_id', 'booking_series_id', 'repeat_weekly',
    'starts_at', 'ends_at', 'blocked_until',
    'service_name', 'price_cents', 'people', 'invite_token', 'place_label',
    'status', 'expires_at', 'confirmed_at', 'client_note',
])]
class Booking extends Model
{
    /** @use HasFactory<BookingFactory> */
    use HasFactory;

    /** @var array<string, mixed> */
    protected $attributes = ['repeat_weekly' => false, 'requested_by' => 'client'];

    /** Days after the end in which the trainer can mark (or unmark) a session as missed. */
    public const NO_SHOW_DAYS = 7;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'blocked_until' => 'datetime',
            'price_cents' => 'integer',
            'people' => 'integer',
            'repeat_weekly' => 'boolean',
            'status' => BookingStatus::class,
            'requested_by' => BookingActor::class,
            'expires_at' => 'datetime',
            'confirmed_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'cancelled_by' => BookingActor::class,
            'no_show_at' => 'datetime',
            'proposed_starts_at' => 'datetime',
            'proposal_expires_at' => 'datetime',
            'reminded_day_before_at' => 'datetime',
            'reminded_soon_at' => 'datetime',
        ];
    }

    /** A session moved to another time ("Sposta" accepted) gets its reminders again. */
    protected static function booted(): void
    {
        static::updating(function (Booking $booking) {
            if ($booking->isDirty('starts_at')) {
                $booking->reminded_day_before_at = null;
                $booking->reminded_soon_at = null;
            }
        });
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    /**
     * "Aggiungi seduta": the person of the trainer's list, with or without an account.
     *
     * @return BelongsTo<TrainerClient, $this>
     */
    public function trainerClient(): BelongsTo
    {
        return $this->belongsTo(TrainerClient::class);
    }

    /**
     * The name the trainer sees: the account's, or the one the trainer wrote
     * for someone without an account.
     */
    public function clientName(): string
    {
        return $this->client->name ?? $this->trainerClient->name ?? 'Account eliminato';
    }

    /** "Aggiungi seduta" with someone without an account: only in the trainer's calendar. */
    public function isOffApp(): bool
    {
        return $this->client_id === null && $this->trainer_client_id !== null;
    }

    /** Asked by the trainer and waiting for the client: accept or decline. */
    public function isTrainerProposal(): bool
    {
        return $this->requested_by === BookingActor::Trainer && $this->isPending();
    }

    /**
     * @return BelongsTo<TrainerProfile, $this>
     */
    public function trainerProfile(): BelongsTo
    {
        return $this->belongsTo(TrainerProfile::class);
    }

    /**
     * The service booked (null once the trainer changed the services).
     *
     * @return BelongsTo<Service, $this>
     */
    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    /**
     * @return BelongsTo<BookingSeries, $this>
     */
    public function series(): BelongsTo
    {
        return $this->belongsTo(BookingSeries::class, 'booking_series_id');
    }

    /**
     * @return BelongsTo<ClientPackage, $this>
     */
    public function clientPackage(): BelongsTo
    {
        return $this->belongsTo(ClientPackage::class);
    }

    /**
     * @return HasMany<BookingEvent, $this>
     */
    public function events(): HasMany
    {
        return $this->hasMany(BookingEvent::class);
    }

    /**
     * "Invita un amico": the friends who joined, also who left.
     *
     * @return HasMany<BookingGuest, $this>
     */
    public function guests(): HasMany
    {
        return $this->hasMany(BookingGuest::class)->oldest('id');
    }

    /**
     * The sessions a user takes part in as a guest, still coming.
     *
     * @param  Builder<self>  $query
     */
    public function scopeWithGuest(Builder $query, User $user): void
    {
        $query->whereHas('guests', fn (Builder $guests) => $guests->joined()->where('user_id', $user->id));
    }

    /** "Invita un amico": a new random link, for a session of more people. */
    public static function newInviteToken(): string
    {
        return Str::random(32);
    }

    /** Places still free for friends: people − the booker − who joined. */
    public function freeSeats(): int
    {
        $joined = $this->relationLoaded('guests')
            ? $this->guests->where('status', BookingGuestStatus::Joined)->count()
            : $this->guests()->joined()->count();

        return max(0, $this->people - 1 - $joined);
    }

    /**
     * The friends still coming, with an account.
     *
     * @return Collection<int, User>
     */
    public function joinedGuestUsers(): Collection
    {
        return $this->guests()->joined()->with('user')->get()
            ->map(fn (BookingGuest $guest) => $guest->user)
            ->filter()
            ->values();
    }

    /** The friends can still join: a session of more people, not over and not cancelled. */
    public function acceptsGuests(): bool
    {
        return $this->people > 1
            && $this->invite_token !== null
            && $this->starts_at->isFuture()
            && ($this->status === BookingStatus::Confirmed || $this->isPending());
    }

    /**
     * The friends still coming hear of it too: confirmed, cancelled, moved,
     * reminders. The booker is told by the caller, as before.
     */
    public function notifyGuests(Notification $notification): void
    {
        $users = $this->joinedGuestUsers();

        if ($users->isNotEmpty()) {
            NotificationFacade::send($users, $notification);
        }
    }

    /**
     * The bookings that take their slot: confirmed, or pending and not expired yet.
     * A pending one past `expires_at` frees the slot even before `bookings:expire` runs.
     *
     * @param  Builder<self>  $query
     */
    public function scopeActive(Builder $query): void
    {
        $query->where(fn (Builder $active) => $active
            ->where('status', BookingStatus::Confirmed)
            ->orWhere(fn (Builder $pending) => $pending->awaitingAnswer()));
    }

    /**
     * Pending and not expired yet: the trainer can still answer.
     *
     * @param  Builder<self>  $query
     */
    public function scopeAwaitingAnswer(Builder $query): void
    {
        $query->where('status', BookingStatus::Pending)->where('expires_at', '>', now());
    }

    /**
     * Asked by the client: the requests of "Richieste", not the trainer's proposals.
     *
     * @param  Builder<self>  $query
     */
    public function scopeFromClient(Builder $query): void
    {
        $query->where('requested_by', BookingActor::Client);
    }

    /**
     * Pending, but the time to answer is over: still to be marked as expired.
     *
     * @param  Builder<self>  $query
     */
    public function scopeOverdue(Builder $query): void
    {
        $query->where('status', BookingStatus::Pending)->where('expires_at', '<=', now());
    }

    /** Pending, but the trainer did not answer in time. */
    public function isExpired(): bool
    {
        return $this->status === BookingStatus::Expired
            || ($this->status === BookingStatus::Pending && $this->expires_at !== null && $this->expires_at->isPast());
    }

    /** Still waiting for the trainer's answer. */
    public function isPending(): bool
    {
        return $this->status === BookingStatus::Pending && ! $this->isExpired();
    }

    /** "Cancellazione gratuita fino a…": the trainer's hours before the start. */
    public function freeCancellationEndsAt(): CarbonImmutable
    {
        return $this->starts_at->subHours($this->trainerProfile->free_cancellation_hours);
    }

    /**
     * The client can still cancel: a request waiting for the trainer until it
     * starts, a confirmed session only while cancelling is free.
     */
    public function canBeCancelledByClient(): bool
    {
        return match (true) {
            $this->isPending() => $this->starts_at->isFuture(),
            // While the trainer proposes another time, cancelling is free too.
            $this->status === BookingStatus::Confirmed => $this->freeCancellationEndsAt()->isFuture()
                || ($this->proposal() !== null && $this->starts_at->isFuture()),
            default => false,
        };
    }

    /**
     * A confirmed session that ended less than NO_SHOW_DAYS ago: the trainer
     * can still mark it as missed, or take the mark back.
     */
    public function canChangeNoShow(): bool
    {
        return $this->status === BookingStatus::Confirmed
            && $this->ends_at->isPast()
            && $this->ends_at->addDays(self::NO_SHOW_DAYS)->isFuture();
    }

    /** Hours a "Sposta" proposal waits for the client (less if the session comes first). */
    public const PROPOSAL_HOURS = 48;

    /**
     * A confirmed session not started yet: the trainer can cancel it or
     * propose another time.
     */
    public function canBeChangedByTrainer(): bool
    {
        return $this->status === BookingStatus::Confirmed && $this->starts_at->isFuture();
    }

    /**
     * The time the trainer proposes, while the client can still accept it:
     * same length and break as now. Null without a live proposal.
     *
     * @return array{start: CarbonImmutable, end: CarbonImmutable, blockedUntil: CarbonImmutable}|null
     */
    public function proposal(): ?array
    {
        if ($this->proposed_starts_at === null || $this->proposal_expires_at === null || $this->proposal_expires_at->isPast()) {
            return null;
        }

        $start = $this->proposed_starts_at;

        return [
            'start' => $start,
            'end' => $start->addSeconds((int) $this->starts_at->diffInSeconds($this->ends_at)),
            'blockedUntil' => $start->addSeconds((int) $this->starts_at->diffInSeconds($this->blocked_until)),
        ];
    }

    /** Takes the proposal away: accepted, declined, withdrawn or expired. */
    public function clearProposal(): void
    {
        $this->forceFill(['proposed_starts_at' => null, 'proposal_expires_at' => null])->save();
    }

    /** Saves a row of the history: requested, confirmed, declined, cancelled, expired. */
    public function record(string $type, ?User $actor = null): void
    {
        $this->events()->create(['type' => $type, 'actor_id' => $actor?->id]);
    }

    /**
     * The trainer said yes (or confirms automatically: then `$actor` is null).
     * The first session of a package also buys the package. Both ways the
     * client gets the "Prenotazione confermata" email.
     */
    public function confirm(?User $actor = null): void
    {
        $this->forceFill([
            'status' => BookingStatus::Confirmed,
            'confirmed_at' => now(),
            'expires_at' => null,
        ])->save();

        $this->record('confirmed', $actor);

        if ($this->client_package_id !== null) {
            ClientPackage::whereKey($this->client_package_id)->whereNull('bought_at')->update(['bought_at' => now()]);
        }

        // Not to the client who just accepted the trainer's proposal: they said yes themselves.
        if ($actor === null || $actor->id !== $this->client_id) {
            $this->client?->notify(new BookingConfirmed($this));
        }
        $this->notifyGuests(new BookingConfirmed($this));
    }

    /**
     * The trainer did not answer in time: declined automatically (no actor).
     * Also frees the slot for the database rule against overlaps.
     */
    public function expire(): void
    {
        $this->forceFill(['status' => BookingStatus::Expired])->save();

        $this->record('expired');
    }

    /** Frees the slot; the history says who did it. */
    public function cancel(BookingActor $by, ?User $actor = null): void
    {
        $this->forceFill([
            'status' => BookingStatus::Cancelled,
            'cancelled_at' => now(),
            'cancelled_by' => $by,
            // A "Sposta" proposal goes with it.
            'proposed_starts_at' => null,
            'proposal_expires_at' => null,
        ])->save();

        $this->record('cancelled', $actor);
    }
}
