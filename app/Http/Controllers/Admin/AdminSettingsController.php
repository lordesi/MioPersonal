<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Admin\Concerns\BuildsAdminArea;
use App\Http\Controllers\Controller;
use App\Models\AdminActivity;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Impostazioni e registro": the team (the admin accounts) and the
 * "Registro attività", the newest first. The defaults (hours to confirm,
 * free cancellation) are still fixed in the code.
 */
class AdminSettingsController extends Controller
{
    use BuildsAdminArea;

    /** Enough for the beta. */
    private const LOG_LIMIT = 200;

    public function __invoke(): Response
    {
        return Inertia::render('admin/settings', [
            'adminArea' => $this->adminArea(),
            'team' => User::query()
                ->where('role', UserRole::Admin)
                ->orderBy('name')
                ->get()
                ->map(fn (User $admin) => [
                    'id' => $admin->id,
                    'name' => $admin->name,
                    'email' => $admin->email,
                    'lastActiveAt' => $admin->last_active_at?->toIso8601ZuluString(),
                ])->all(),
            'activity' => AdminActivity::query()
                ->with('admin')
                ->latest('id')
                ->limit(self::LOG_LIMIT)
                ->get()
                ->map(fn (AdminActivity $activity) => $activity->toRow())
                ->all(),
        ]);
    }
}
