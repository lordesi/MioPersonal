<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\BuildsGymArea;
use App\Models\User;
use App\Support\TrainerSlots;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Panoramica" of the gym area: how complete the profile is, the numbers of
 * the last 30 days and the trainers' requests waiting for an answer.
 */
class GymDashboardController extends Controller
{
    use BuildsGymArea;

    public function __invoke(Request $request): Response|RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $profile = $user->gymProfile;

        // Made a gym by hand, never registered: the registration first.
        if ($profile === null) {
            return to_route('gym.register');
        }

        $since = CarbonImmutable::now(TrainerSlots::TIMEZONE)->subDays(29)->toDateString();

        return Inertia::render('gym/dashboard', [
            'gymArea' => $this->gymArea(),
            'name' => $profile->name,
            'approved' => $profile->isApproved(),
            'checklist' => [
                'cover' => $profile->cover()->exists(),
                'gallery' => $profile->galleryPhotos()->count(),
                'hours' => $profile->openingHours()->exists(),
                'plans' => $profile->activePlans()->count(),
                'promotions' => $profile->activePromotions()->count(),
                'trainers' => $profile->trainers()->count(),
            ],
            'views' => (int) DB::table('gym_profile_views')
                ->where('gym_profile_id', $profile->id)
                ->where('day', '>=', $since)
                ->sum('views'),
            'pendingCount' => self::awaitingGym($profile)->count(),
        ]);
    }
}
