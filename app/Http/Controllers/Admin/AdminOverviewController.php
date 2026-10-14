<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Admin\Concerns\BuildsAdminPlaceholderData;
use App\Http\Controllers\Controller;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

/** "Panoramica": what to do today and the main numbers of the platform. */
class AdminOverviewController extends Controller
{
    use BuildsAdminPlaceholderData;

    /** "Trainer attivi": trainers who used the web app in this many hours. */
    public const ACTIVE_HOURS = 24;

    public function __invoke(): Response
    {
        // TODO: count users and bookings from the database (bookings: step 5).
        $area = $this->adminArea();

        return Inertia::render('admin/overview', [
            'adminArea' => $area,
            'todo' => [
                'verificationCount' => $area['verificationCount'],
                'oldestWaitDays' => 3,
                'expiredToday' => 2,
                // TODO: the reporting system (Prompt 9): profiles and reviews reported by users.
                'reportedCount' => 0,
            ],
            'stats' => [
                'users' => 412,
                'usersThisWeek' => 38,
                // Real: users.last_active_at is kept up to date by TrackLastActivity.
                'activeTrainers' => User::query()
                    ->where('role', UserRole::Trainer)
                    ->where('last_active_at', '>=', now()->subHours(self::ACTIVE_HOURS))
                    ->count(),
                'bookingsThisWeek' => 96,
                'bookingsLastWeek' => 86,
                'confirmedRate' => 0.91,
                'expiredRate' => 0.06,
                'declinedRate' => 0.03,
            ],
        ]);
    }
}
