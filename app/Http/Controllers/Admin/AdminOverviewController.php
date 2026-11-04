<?php

namespace App\Http\Controllers\Admin;

use App\Enums\BookingStatus;
use App\Enums\TrainerProfileStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Admin\Concerns\BuildsAdminPlaceholderData;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Support\TrainerSlots;
use Carbon\CarbonImmutable;
use Inertia\Inertia;
use Inertia\Response;

/** "Panoramica": what to do today and the main numbers of the platform. */
class AdminOverviewController extends Controller
{
    use BuildsAdminPlaceholderData;

    /** "Trainer attivi": trainers who used the web app in this many hours. */
    public const ACTIVE_HOURS = 24;

    /** "Prenotazioni confermate": the requests of this many days. */
    private const RATE_DAYS = 30;

    public function __invoke(): Response
    {
        $area = $this->adminArea();
        $weekAgo = now()->subDays(7);

        // The oldest profile still waiting for the team.
        $oldestWait = TrainerProfile::query()
            ->where('status', TrainerProfileStatus::Review)
            ->min('status_changed_at');

        return Inertia::render('admin/overview', [
            'adminArea' => $area,
            'todo' => [
                'verificationCount' => $area['verificationCount'],
                'oldestWaitDays' => $oldestWait === null ? 0 : (int) CarbonImmutable::parse($oldestWait)->diffInDays(now()),
                // Requests whose deadline passed today, in Rome, without an answer.
                'expiredToday' => Booking::query()
                    ->whereIn('status', [BookingStatus::Expired, BookingStatus::Pending])
                    ->whereBetween('expires_at', [now(TrainerSlots::TIMEZONE)->startOfDay(), now()])
                    ->count(),
                // TODO: the reporting system (Prompt 9): profiles and reviews reported by users.
                'reportedCount' => 0,
            ],
            'stats' => [
                'users' => User::query()->where('role', '!=', UserRole::Admin)->count(),
                'usersThisWeek' => User::query()->where('role', '!=', UserRole::Admin)->where('created_at', '>=', $weekAgo)->count(),
                // users.last_active_at is kept up to date by TrackLastActivity.
                'activeTrainers' => User::query()
                    ->where('role', UserRole::Trainer)
                    ->where('last_active_at', '>=', now()->subHours(self::ACTIVE_HOURS))
                    ->count(),
                'bookingsThisWeek' => Booking::query()->where('created_at', '>=', $weekAgo)->count(),
                'bookingsLastWeek' => Booking::query()->whereBetween('created_at', [now()->subDays(14), $weekAgo])->count(),
                ...self::answerRates(),
            ],
        ]);
    }

    /**
     * Of the requests of the last 30 days that got an outcome: how many the
     * trainer confirmed (even if cancelled later), let expire or declined.
     *
     * @return array{confirmedRate: float, expiredRate: float, declinedRate: float}
     */
    private static function answerRates(): array
    {
        $recent = fn () => Booking::query()->where('created_at', '>=', now()->subDays(self::RATE_DAYS));

        $confirmed = $recent()->whereNotNull('confirmed_at')->count();
        $expired = $recent()->where('status', BookingStatus::Expired)->count();
        $declined = $recent()->where('status', BookingStatus::Declined)->count();
        $total = max(1, $confirmed + $expired + $declined);

        return [
            'confirmedRate' => round($confirmed / $total, 2),
            'expiredRate' => round($expired / $total, 2),
            'declinedRate' => round($declined / $total, 2),
        ];
    }
}
