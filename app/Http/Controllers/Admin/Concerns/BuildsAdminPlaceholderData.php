<?php

namespace App\Http\Controllers\Admin\Concerns;

use App\Enums\TrainerProfileStatus;
use App\Http\Controllers\Concerns\BuildsPlaceholderData;
use App\Models\TrainerProfile;

/**
 * Placeholder data of the admin panel, shown until the real tables exist.
 * TODO: delete once every admin page reads from the database.
 */
trait BuildsAdminPlaceholderData
{
    use BuildsPlaceholderData;

    /**
     * The badges of the admin menu, sent by every admin page. "Messaggi" has
     * none while the page is "In lavorazione".
     * TODO: the profiles and reviews reported by users (Prompt 9).
     *
     * @return array{verificationCount: int, flaggedReviews: int}
     */
    private function adminArea(): array
    {
        return [
            'verificationCount' => TrainerProfile::where('status', TrainerProfileStatus::Review)->count(),
            'flaggedReviews' => 0,
        ];
    }
}
