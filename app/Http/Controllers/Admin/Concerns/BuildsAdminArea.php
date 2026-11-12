<?php

namespace App\Http\Controllers\Admin\Concerns;

use App\Enums\TrainerProfileStatus;
use App\Http\Controllers\Concerns\BuildsPlaceholderData;
use App\Models\ContactMessage;
use App\Models\GymProfile;
use App\Models\Report;
use App\Models\TrainerProfile;
use Illuminate\Support\Facades\DB;

/**
 * What every admin page sends: the menu badges. With the date helpers of
 * BuildsPlaceholderData, still used by some admin pages.
 */
trait BuildsAdminArea
{
    use BuildsPlaceholderData;

    /**
     * The badges of the admin menu, sent by every admin page. "Segnalazioni":
     * the contents reported and not checked yet (one per content).
     *
     * @return array{verificationCount: int, gymVerificationCount: int, unreadMessages: int, openReports: int}
     */
    private function adminArea(): array
    {
        return [
            'verificationCount' => TrainerProfile::where('status', TrainerProfileStatus::Review)->count(),
            'gymVerificationCount' => GymProfile::where('status', TrainerProfileStatus::Review)->count(),
            'unreadMessages' => ContactMessage::unread()->count(),
            'openReports' => DB::query()
                ->fromSub(Report::open()->select(['reportable_type', 'reportable_id'])->distinct(), 'reported')
                ->count(),
        ];
    }
}
