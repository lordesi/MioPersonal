<?php

namespace App\Http\Controllers;

use App\Actions\Trainer\SaveTrainerServices;
use App\Http\Controllers\Concerns\BuildsPlaceholderData;
use App\Http\Requests\TrainerServicesRequest;
use App\Models\Service;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Support\ServiceBookings;
use App\Support\TrainerDraft;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Servizi e prezzi": the trainer changes the kinds of session and their
 * prices, the first session and the packages (step 4 of "Diventa trainer"),
 * also while the profile waits for the approval, like "Disponibilità".
 * Saved changes are public right away, without a new review, like
 * "Modifica profilo".
 */
class TrainerServicesController extends Controller
{
    use BuildsPlaceholderData;

    public function show(Request $request): Response
    {
        $profile = $this->profile($request);

        return Inertia::render('trainer/services', [
            'trainerArea' => $this->trainerArea(),
            // null: the registration was never sent, the page links to "Diventa trainer".
            'pricing' => $profile === null ? null : TrainerDraft::pricing($profile),
            // Separate online prices only for who trains both online and in person.
            'asksOnlinePrice' => $profile !== null && $profile->trains_online && $profile->trains_in_person,
            'booked' => $profile === null ? [] : $this->booked($profile),
        ]);
    }

    /**
     * "Prenotazioni degli ultimi 90 giorni": "Seduta singola · 60 min" => 12,
     * the hidden services too (their bookings still count), most first.
     *
     * @return list<array{label: string, count: int}>
     */
    private function booked(TrainerProfile $profile): array
    {
        $counts = ServiceBookings::counts($profile->id);

        return array_values($profile->services()->whereKey(array_keys($counts))->get()
            ->map(fn (Service $service) => [
                'label' => "{$service->displayName()} · {$service->minutes} min",
                'count' => $counts[$service->id],
            ])
            ->sortByDesc('count')
            ->all());
    }

    public function update(TrainerServicesRequest $request, SaveTrainerServices $saver): RedirectResponse
    {
        $profile = $this->profile($request) ?? abort(404);

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
