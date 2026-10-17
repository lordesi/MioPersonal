<?php

namespace App\Http\Controllers;

use App\Actions\Trainer\SaveTrainerServices;
use App\Http\Controllers\Concerns\BuildsPlaceholderData;
use App\Http\Requests\TrainerServicesRequest;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Support\TrainerDraft;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Servizi e prezzi": an approved trainer changes the kinds of session and
 * their prices, the first session and the packages (step 4 of "Diventa
 * trainer"). Saved changes are public right away, without a new review,
 * like "Modifica profilo". Before the approval they are changed from
 * "Diventa trainer" instead.
 */
class TrainerServicesController extends Controller
{
    use BuildsPlaceholderData;

    public function show(Request $request): Response
    {
        $profile = $this->profile($request);
        $editable = $profile?->isApproved() ?? false;

        return Inertia::render('trainer/services', [
            'trainerArea' => $this->trainerArea(),
            // null: not approved yet, the page links to "Diventa trainer".
            'pricing' => $editable ? TrainerDraft::pricing($profile) : null,
            // Separate online prices only for who trains both online and in person.
            'asksOnlinePrice' => $editable && $profile->trains_online && $profile->trains_in_person,
        ]);
    }

    public function update(TrainerServicesRequest $request, SaveTrainerServices $saver): RedirectResponse
    {
        $profile = $this->profile($request);

        abort_unless($profile?->isApproved() ?? false, 403);

        $saver->handle($profile, $request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Servizi aggiornati.']);

        return back();
    }

    private function profile(Request $request): ?TrainerProfile
    {
        /** @var User $user */
        $user = $request->user();

        return $user->trainerProfile;
    }
}
