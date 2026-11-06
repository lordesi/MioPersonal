<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\BuildsPlaceholderData;
use App\Http\Requests\TrainerAvailabilityRequest;
use App\Http\Requests\TrainerDayOverrideRequest;
use App\Models\User;
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
 * "Disponibilità e regole": the working hours ("Orari di base", every week)
 * and booking rules chosen in step 5 of "Diventa trainer", changed at any
 * time, and "Giorni e settimane diverse": a day, a week or the holidays with
 * other hours or closed (TrainerDayOverrides), saved right away.
 *
 * Saving does not send the profile back to the team: hours are not checked.
 * Bookings already made stay valid, even outside the new hours.
 */
class TrainerAvailabilityController extends Controller
{
    use BuildsPlaceholderData;

    public function show(Request $request): Response
    {
        /** @var User $trainer */
        $trainer = $request->user();
        $profile = $trainer->trainerProfile;

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
        /** @var User $trainer */
        $trainer = $request->user();
        $profile = $trainer->trainerProfile ?? abort(404);
        $data = $request->validated();

        DB::transaction(function () use ($profile, $data) {
            $profile->fill(TrainerAvailability::attributes($data))->save();
            TrainerAvailability::saveHours($profile, $data['hours']);
        });

        // The first free slot shown in the search follows the new hours.
        TrainerSlots::refresh($profile->load('workingHours'));

        return back();
    }

    /** "Modifica un giorno o una settimana": saved right away. */
    public function storeOverride(TrainerDayOverrideRequest $request): RedirectResponse
    {
        /** @var User $trainer */
        $trainer = $request->user();
        $profile = $trainer->trainerProfile ?? abort(404);
        $closed = $request->boolean('closed');

        TrainerDayOverrides::save(
            $profile,
            CarbonImmutable::parse($request->string('from')->value()),
            CarbonImmutable::parse($request->string('to')->value()),
            $closed ? null : $request->array('hours'),
            $request->input('note'),
        );

        TrainerSlots::refresh($profile->load('workingHours'));
        Inertia::flash('toast', ['type' => 'success', 'message' => $closed ? 'Giorni chiusi salvati.' : 'Orari salvati.']);

        return back();
    }

    /** "Ripristina orari di base": the weekly hours again for those days. */
    public function destroyOverride(Request $request): RedirectResponse
    {
        /** @var User $trainer */
        $trainer = $request->user();
        $profile = $trainer->trainerProfile ?? abort(404);
        $data = $request->validate([
            'from' => ['required', 'date_format:Y-m-d'],
            'to' => ['required', 'date_format:Y-m-d', 'after_or_equal:from'],
        ]);

        TrainerDayOverrides::clear($profile, CarbonImmutable::parse($data['from']), CarbonImmutable::parse($data['to']));
        TrainerSlots::refresh($profile->load('workingHours'));
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Tornano gli orari di base.']);

        return back();
    }
}
