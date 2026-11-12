<?php

namespace App\Http\Controllers;

use App\Enums\BookingStatus;
use App\Models\TrainerClient;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * "Condividi i miei progressi con Marco": per trainer, off by default, with
 * the trainers the client had at least one confirmed session with. The
 * trainer then sees the client's "Panoramica" in the client's record.
 */
class ClientSharingController extends Controller
{
    public function update(Request $request, TrainerClient $record): RedirectResponse
    {
        /** @var User $client */
        $client = $request->user();
        abort_unless(self::records($client)->contains('id', $record->id), 404);

        $shared = $request->validate(['shared' => ['required', 'boolean']])['shared'];
        $record->forceFill(['progress_shared_at' => $shared ? ($record->progress_shared_at ?? now()) : null])->save();

        $trainer = $record->trainerProfile->user->first_name;
        Inertia::flash('toast', ['type' => 'success', 'message' => $shared
            ? "Ora {$trainer} vede i tuoi progressi."
            : "{$trainer} non vede più i tuoi progressi."]);

        return back();
    }

    /**
     * The client's rows in the lists of the trainers they really trained or
     * will train with: a confirmed session, a published profile.
     *
     * @return Collection<int, TrainerClient>
     */
    public static function records(User $client): Collection
    {
        return TrainerClient::query()
            ->where('user_id', $client->id)
            ->whereHas('trainerProfile', fn (Builder $profile) => $profile->published())
            ->whereExists(fn ($booking) => $booking
                ->selectRaw('1')
                ->from('bookings')
                ->whereColumn('bookings.trainer_profile_id', 'trainer_clients.trainer_profile_id')
                ->where('bookings.client_id', $client->id)
                ->where('bookings.status', BookingStatus::Confirmed->value))
            ->with('trainerProfile.user')
            ->get();
    }
}
