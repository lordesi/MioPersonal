<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\BuildsTrainerArea;
use App\Models\User;
use App\Support\TrainerSlots;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Profilo": the list of the trainer area for everything that is not the
 * daily work. What the clients book (services, hours, events, gyms), what
 * they see (public profile, sharing, reviews), the account and the help.
 * The switch "Accetto nuovi clienti" saves through TrainerProfileSettingsController.
 */
class TrainerProfileHubController extends Controller
{
    use BuildsTrainerArea;

    public function __invoke(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $profile = $user->trainerProfile;
        $pausedUntil = $profile?->paused_until?->isFuture() ? $profile->paused_until : null;

        return Inertia::render('trainer/profile-hub', [
            'trainerArea' => $this->trainerArea(),
            'me' => [
                'name' => $user->name,
                'avatar' => $user->avatar,
                // "Boxe e Functional · Milano", under the name.
                'subtitle' => $profile === null ? null : collect([
                    $profile->disciplines->take(2)->pluck('name')->join(', ', ' e '),
                    $profile->city?->name,
                ])->filter()->join(' · '),
                // "miopersonal.it/trainer/giulia-rossi", null until the registration is sent.
                'publicUrl' => $profile === null ? null : route('trainers.show', $profile->slug),
                // "Condividi profilo": only once the profile is in the search,
                // before that the link leads nowhere.
                'shareUrl' => $profile !== null && $user->trainerProfile()->published()->exists()
                    ? $profile->shareLink('condividi', 'profilo')
                    : null,
            ],
            // Null until the registration is sent: no switch to show.
            'visibility' => $profile === null ? null : [
                'visibleInSearch' => $profile->visible_in_search,
                'acceptsNewClients' => $profile->accepts_new_clients,
                'pausedUntil' => $pausedUntil?->setTimezone(TrainerSlots::TIMEZONE)->toDateString(),
                'paused' => $profile->paused_at !== null,
            ],
            // The numbers on the right of the rows ("4 servizi", "4,8 · 12").
            'counts' => $profile === null ? null : [
                'services' => $profile->services()->count(),
                'gyms' => $profile->gyms()->count(),
                'reviews' => $profile->rating_count,
                'rating' => $profile->rating(),
            ],
        ]);
    }
}
