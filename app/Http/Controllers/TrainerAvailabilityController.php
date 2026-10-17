<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\BuildsPlaceholderData;
use App\Http\Requests\TrainerAvailabilityRequest;
use App\Models\User;
use App\Support\TrainerAvailability;
use App\Support\TrainerSlots;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Disponibilità e regole": the working hours and booking rules chosen in
 * step 5 of "Diventa trainer", changed at any time. Saving does not send
 * the profile back to the team: hours are not checked. Bookings already
 * made stay valid, even outside the new hours.
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
}
