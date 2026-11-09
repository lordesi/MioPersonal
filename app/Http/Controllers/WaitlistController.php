<?php

namespace App\Http\Controllers;

use App\Actions\Waitlist\Waitlist;
use App\Models\GroupSession;
use App\Models\TrainerProfile;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * "Avvisami se si libera": a client waits for a place in a full event, or for
 * a slot on a day a trainer is full (App\Actions\Waitlist\Waitlist).
 */
class WaitlistController extends Controller
{
    public function joinEvent(Request $request, string $slug, Waitlist $waitlist): RedirectResponse
    {
        $waitlist->joinEvent($this->client($request), $this->session($slug));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Ti avvisiamo se si libera un posto.']);

        return back();
    }

    public function leaveEvent(Request $request, string $slug, Waitlist $waitlist): RedirectResponse
    {
        $waitlist->leaveEvent($this->client($request), $this->session($slug));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Non ti avvisiamo più per questo evento.']);

        return back();
    }

    public function joinDay(Request $request, string $slug, Waitlist $waitlist): RedirectResponse
    {
        $data = $request->validate(['date' => ['required', 'date_format:Y-m-d']], ['date.*' => 'Scegli il giorno.']);

        $waitlist->joinDay($this->client($request), $this->trainer($slug), $data['date']);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Ti avvisiamo se si libera uno slot quel giorno.']);

        return back();
    }

    public function leaveDay(Request $request, string $slug, Waitlist $waitlist): RedirectResponse
    {
        $data = $request->validate(['date' => ['required', 'date_format:Y-m-d']]);

        $waitlist->leaveDay($this->client($request), $this->trainer($slug), $data['date']);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Non ti avvisiamo più per quel giorno.']);

        return back();
    }

    private function client(Request $request): User
    {
        /** @var User $user */
        $user = $request->user();

        return $user;
    }

    private function session(string $slug): GroupSession
    {
        $session = GroupSession::query()->where('slug', $slug)->withCount('activeRegistrations as registered_count')->first();

        abort_if($session === null || $session->hidden_at !== null, 404);

        return $session;
    }

    private function trainer(string $slug): TrainerProfile
    {
        $profile = TrainerProfile::query()->where('slug', $slug)->with('workingHours')->first();

        abort_if($profile === null || ! $profile->isApproved(), 404);

        return $profile;
    }
}
