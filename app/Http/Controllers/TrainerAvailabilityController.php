<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\BuildsTrainerArea;
use App\Http\Requests\TrainerAvailabilityRequest;
use App\Support\TrainerAvailability;
use App\Support\TrainerDayOverrides;
use App\Support\TrainerSlots;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Disponibilità": the working hours ("Orari abituali", every week) and
 * booking rules chosen in step 5 of "Diventa trainer", changed at any time,
 * and the days with other hours or closed ("Per settimana", "Ferie e
 * chiusure", TrainerDayOverrides), all saved with "Salva modifiche".
 *
 * Saving does not send the profile back to the team: hours are not checked.
 * Bookings already made stay valid, even outside the new hours.
 */
class TrainerAvailabilityController extends Controller
{
    use BuildsTrainerArea;

    public function show(Request $request): Response
    {
        $profile = $this->trainerProfileOrNull($request);

        return Inertia::render('trainer/availability', [
            'trainerArea' => $this->trainerArea(),
            // null: the registration was never sent, there is nothing to change yet.
            'availability' => $profile === null ? null : TrainerAvailability::fromProfile($profile),
            'overrides' => $profile === null ? [] : TrainerDayOverrides::blocks($profile),
            'today' => CarbonImmutable::now(TrainerSlots::TIMEZONE)->toDateString(),
        ]);
    }

    public function update(TrainerAvailabilityRequest $request): RedirectResponse
    {
        $profile = $this->trainerProfile($request);
        $data = $request->validated();

        DB::transaction(function () use ($profile, $data) {
            $profile->fill(TrainerAvailability::attributes($data))->save();
            TrainerAvailability::saveHours($profile, $data['hours']);
            TrainerDayOverrides::apply($profile, $data['days'] ?? [], $data['reset'] ?? []);
        });

        // The first free slot shown in the search follows the new hours.
        TrainerSlots::refresh($profile->load('workingHours'));
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Disponibilità aggiornata.']);

        return back();
    }
}
