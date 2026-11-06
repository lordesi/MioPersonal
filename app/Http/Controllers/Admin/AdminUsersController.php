<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Admin\Concerns\BuildsAdminPlaceholderData;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Utenti": clients, trainers and gyms, the newest first. Also the page of the
 * search box at the top of the admin panel (?cerca=anna): "#1048" opens
 * that booking in "Prenotazioni". "Sospendi" and "Cancella dati":
 * AdminUserStatusController.
 */
class AdminUsersController extends Controller
{
    use BuildsAdminPlaceholderData;

    /** Enough for the beta: the search box finds the others. */
    private const LIMIT = 200;

    public function __invoke(Request $request): Response|RedirectResponse
    {
        $search = $request->string('cerca')->squish()->value();

        if (preg_match('/^#(\d+)$/', $search, $match) === 1) {
            return to_route('admin.bookings', ['cerca' => (int) $match[1]]);
        }

        $clients = $this->users(UserRole::Client, $search)
            ->withCount('bookings')
            ->get();

        $trainers = $this->users(UserRole::Trainer, $search)
            ->with('trainerProfile')
            ->get();

        $gyms = $this->users(UserRole::Gym, $search)
            // "N trainer": the links both sides accepted.
            ->with(['gymProfile' => fn ($query) => $query->with('city')->withCount('trainers')])
            ->get();

        return Inertia::render('admin/users', [
            'adminArea' => $this->adminArea(),
            'search' => $search === '' ? null : $search,
            'clients' => $clients->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'joinedAt' => $user->created_at?->toIso8601ZuluString(),
                'bookingCount' => $user->bookings_count,
                ...$this->status($user),
            ])->all(),
            'trainers' => $trainers->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'joinedAt' => $user->created_at?->toIso8601ZuluString(),
                // A trainer account without a profile yet is still in the sign-up.
                'profileStatus' => $user->trainerProfile->status->value ?? 'review',
                'reviewCount' => $user->trainerProfile->rating_count ?? 0,
                'rating' => $user->trainerProfile?->rating(),
                ...$this->status($user),
            ])->all(),
            'gyms' => $gyms->map(fn (User $user) => [
                'id' => $user->id,
                // The gym, or the contact person while the profile is still missing.
                'name' => $user->gymProfile->name ?? $user->name,
                'contact' => $user->name,
                'email' => $user->email,
                'city' => $user->gymProfile?->city->name,
                'joinedAt' => $user->created_at?->toIso8601ZuluString(),
                'profileStatus' => $user->gymProfile->status->value ?? 'review',
                'trainerCount' => (int) ($user->gymProfile->trainers_count ?? 0),
                'profileHref' => $user->gymProfile === null ? null : route('gyms.show', $user->gymProfile->slug, false),
                ...$this->status($user),
            ])->all(),
        ]);
    }

    /**
     * "Sospeso", "Eliminazione il 6 dic" (AdminUserStatusController).
     *
     * @return array{suspended: bool, deletionAt: string|null, deletionByUser: bool}
     */
    private function status(User $user): array
    {
        return [
            'suspended' => $user->suspended_at !== null,
            // ISO UTC string: when the data goes.
            'deletionAt' => $user->deletionDate()?->toIso8601ZuluString(),
            'deletionByUser' => $user->hasPendingSelfDeletion(),
        ];
    }

    /**
     * The users of a role, the newest first; the search looks in name and email
     * (and in the name of the gym).
     *
     * @return Builder<User>
     */
    private function users(UserRole $role, string $search): Builder
    {
        return User::query()
            ->where('role', $role)
            ->when($search !== '', function (Builder $query) use ($search, $role) {
                $like = '%'.mb_strtolower($search).'%';
                $query->where(fn (Builder $query) => $query
                    ->whereRaw("lower(first_name || ' ' || last_name) like ?", [$like])
                    ->orWhereRaw('lower(email) like ?', [$like])
                    ->when($role === UserRole::Gym, fn (Builder $query) => $query
                        ->orWhereHas('gymProfile', fn (Builder $gym) => $gym->whereRaw('lower(name) like ?', [$like]))));
            })
            ->latest()
            ->limit(self::LIMIT);
    }
}
