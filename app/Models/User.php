<?php

namespace App\Models;

use App\Enums\UserRole;
use Carbon\CarbonInterface;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Appends;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

/**
 * @property int $id
 * @property string $first_name
 * @property string $last_name
 * @property string $name "Nome Cognome", computed from first_name and last_name
 * @property string $email
 * @property string|null $google_id set by "Continua con Google"
 * @property string|null $phone
 * @property string|null $avatar_path the client's photo, on the public disk
 * @property-read string|null $avatar URL of the photo, for the avatars of the site
 * @property Carbon|null $email_verified_at
 * @property string|null $password null for who signed up with Google
 * @property UserRole $role
 * @property Carbon|null $terms_accepted_at
 * @property Carbon|null $marketing_opt_in_at
 * @property Carbon|null $password_changed_at
 * @property Carbon|null $suspended_at "Sospendi" of the admin: no access until "Riattiva"
 * @property Carbon|null $deletion_scheduled_at "Elimina account" / "Cancella dati": deleted DELETION_GRACE_DAYS later
 * @property string|null $deletion_requested_by DELETION_BY_USER or DELETION_BY_ADMIN
 * @property Carbon|null $last_active_at when the user last used the web app (TrackLastActivity)
 * @property array{source: string, medium: string|null, campaign: string|null, landing: string}|null $acquisition where the user came from at sign-up (Stats::acquisition())
 * @property string|null $two_factor_secret unused: two-factor authentication is off
 * @property string|null $two_factor_recovery_codes unused
 * @property Carbon|null $two_factor_confirmed_at unused
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['first_name', 'last_name', 'name', 'email', 'phone', 'password', 'terms_accepted_at', 'marketing_opt_in_at'])]
#[Hidden(['password', 'google_id', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
#[Appends(['name', 'avatar'])]
class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /** Where the photos of "Completa il tuo profilo" are stored. */
    public const AVATAR_DISK = 'public';

    /** Days between "Elimina account" and the real deletion (users:purge-deleted). */
    public const DELETION_GRACE_DAYS = 30;

    /** From the settings: the user can take it back by logging in. */
    public const DELETION_BY_USER = 'user';

    /** "Cancella dati" of the team: only the team can take it back. */
    public const DELETION_BY_ADMIN = 'admin';

    /**
     * New users are clients. The role is not fillable on purpose: nobody can
     * become an admin by sending "role" in a form.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'role' => 'client',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => UserRole::class,
            'terms_accepted_at' => 'datetime',
            'marketing_opt_in_at' => 'datetime',
            'password_changed_at' => 'datetime',
            'suspended_at' => 'datetime',
            'deletion_scheduled_at' => 'datetime',
            'last_active_at' => 'datetime',
            'acquisition' => 'array',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    /**
     * Can't use the site: suspended, or deleted by the team (EnsureAccountActive
     * logs them out). A deletion the user asked for is not a block: they can log
     * in to take it back.
     */
    public function isBlocked(): bool
    {
        return $this->suspended_at !== null
            || ($this->deletion_scheduled_at !== null && $this->deletion_requested_by !== self::DELETION_BY_USER);
    }

    /** "Elimina account" from the settings, not deleted yet. */
    public function hasPendingSelfDeletion(): bool
    {
        return $this->deletion_scheduled_at !== null && $this->deletion_requested_by === self::DELETION_BY_USER;
    }

    /** The day the data goes, null without a deletion. */
    public function deletionDate(): ?CarbonInterface
    {
        return $this->deletion_scheduled_at?->copy()->addDays(self::DELETION_GRACE_DAYS);
    }

    /**
     * Not suspended and not in deletion: who can show up on the site (the
     * trainers of TrainerProfile::scopePublished).
     *
     * @param  Builder<self>  $query
     */
    public function scopeActive(Builder $query): void
    {
        $query->whereNull('suspended_at')->whereNull('deletion_scheduled_at');
    }

    /**
     * "Nome Cognome". Setting it splits at the first space, so Fortify and the
     * starter kit pages, which only know `name`, keep working.
     *
     * @return Attribute<string, string>
     */
    protected function name(): Attribute
    {
        return Attribute::make(
            get: fn (mixed $value, array $attributes) => trim(($attributes['first_name'] ?? '').' '.($attributes['last_name'] ?? '')),
            set: function (string $value) {
                [$firstName, $lastName] = array_pad(explode(' ', trim($value), 2), 2, '');

                return ['first_name' => $firstName, 'last_name' => $lastName];
            },
        );
    }

    /**
     * "Anna B.": the name shown to strangers, e.g. under a public review.
     * The full last name stays private.
     */
    public function publicName(): string
    {
        $initial = mb_substr($this->last_name, 0, 1);

        return $initial === '' ? $this->first_name : "{$this->first_name} {$initial}.";
    }

    /**
     * URL of the photo, or null: the avatars then show the initials.
     * Trainers: the profile photo of their public profile (the photo in
     * `avatar_path` is the one of "Completa il tuo profilo", for clients).
     *
     * @return Attribute<string|null, never>
     */
    protected function avatar(): Attribute
    {
        return Attribute::get(function () {
            $portrait = $this->role === UserRole::Trainer ? $this->trainerProfile?->portrait : null;

            if ($portrait !== null) {
                return $portrait->url();
            }

            return $this->avatar_path === null
                ? null
                : Storage::disk(self::AVATAR_DISK)->url($this->avatar_path);
        });
    }

    /**
     * The answers of "Completa il tuo profilo" (clients only; empty until saved).
     *
     * @return HasOne<ClientPreference, $this>
     */
    public function clientPreference(): HasOne
    {
        return $this->hasOne(ClientPreference::class);
    }

    /**
     * The public profile, for trainers (empty until the registration is sent).
     *
     * @return HasOne<TrainerProfile, $this>
     */
    public function trainerProfile(): HasOne
    {
        return $this->hasOne(TrainerProfile::class);
    }

    /**
     * The sessions booked as a client.
     *
     * @return HasMany<Booking, $this>
     */
    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'client_id');
    }

    /**
     * The packages of sessions bought (or being bought) as a client.
     *
     * @return HasMany<ClientPackage, $this>
     */
    public function clientPackages(): HasMany
    {
        return $this->hasMany(ClientPackage::class, 'client_id');
    }

    /**
     * The trainers saved with the heart, last saved first.
     *
     * @return BelongsToMany<TrainerProfile, $this>
     */
    public function favoriteTrainers(): BelongsToMany
    {
        return $this->belongsToMany(TrainerProfile::class, 'favorites', 'client_id')
            ->withPivot('created_at')
            ->orderByPivot('created_at', 'desc');
    }

    public function isAdmin(): bool
    {
        return $this->role === UserRole::Admin;
    }
}
