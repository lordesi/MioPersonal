<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\BuildsAdminPlaceholderData;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

/** "Panoramica": what to do today and the main numbers of the platform. */
class AdminOverviewController extends Controller
{
    use BuildsAdminPlaceholderData;

    public function __invoke(): Response
    {
        // TODO: count users, trainers and bookings from the database.
        $area = $this->adminArea();
        $today = $this->romeNow()->startOfDay();
        $perDay = [6, 9, 7, 11, 13, 8, 4, 9, 12, 10, 15, 17, 11, 6];

        return Inertia::render('admin/overview', [
            'adminArea' => $area,
            'todo' => [
                'verificationCount' => $area['verificationCount'],
                'oldestWaitDays' => 3,
                'unreadMessages' => $area['unreadMessages'],
                'privacyRequests' => 1,
                'expiredToday' => 2,
                'flaggedReviews' => $area['flaggedReviews'],
            ],
            'stats' => [
                'users' => 412,
                'usersThisWeek' => 38,
                'activeTrainers' => 38,
                'approvedThisWeek' => 4,
                'bookingsThisWeek' => 96,
                'bookingsLastWeek' => 86,
                'confirmedRate' => 0.91,
                'expiredRate' => 0.06,
                'declinedRate' => 0.03,
            ],
            // Oldest first, the last one is today. Dates are Rome calendar days.
            'bookingsPerDay' => array_map(fn (int $count, int $index) => [
                'date' => $today->subDays(count($perDay) - 1 - $index)->format('Y-m-d'),
                'count' => $count,
            ], $perDay, array_keys($perDay)),
            'activity' => $this->activityLog(),
        ]);
    }
}
