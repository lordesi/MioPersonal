<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Admin\Concerns\BuildsAdminPlaceholderData;
use App\Http\Controllers\Controller;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

/** "Impostazioni e registro": default booking rules, the admin team, the activity log. */
class AdminSettingsController extends Controller
{
    use BuildsAdminPlaceholderData;

    public function __invoke(): Response
    {
        return Inertia::render('admin/settings', [
            'adminArea' => $this->adminArea(),
            // TODO: save the defaults; new trainers start from them.
            'defaults' => ['confirmHours' => 24, 'freeCancellationHours' => 24],
            'hourOptions' => [12, 24, 48],
            'team' => User::query()
                ->where('role', UserRole::Admin)
                ->orderBy('name')
                ->get()
                ->map(fn (User $user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'twoFactorEnabled' => $user->two_factor_confirmed_at !== null,
                ]),
            // TODO: record the team's actions in an activity log table.
            'activity' => $this->activityLog(),
        ]);
    }
}
