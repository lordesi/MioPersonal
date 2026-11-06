<?php

namespace App\Http\Controllers;

use App\Actions\Gym\GymLinks;
use App\Enums\GymLinkSide;
use App\Enums\GymLinkStatus;
use App\Enums\TrainerProfileStatus;
use App\Http\Controllers\Concerns\BuildsGymArea;
use App\Models\GymProfile;
use App\Models\GymTrainerLink;
use App\Models\TrainerProfile;
use App\Support\TrainerCard;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Trainer" of the gym area: who works here, the trainers' requests to
 * answer, the invitations sent, and the search to invite a new trainer.
 */
class GymTrainersController extends Controller
{
    use BuildsGymArea;

    public function show(Request $request): Response
    {
        $profile = $this->gymOrFail();
        $query = trim((string) $request->query('q', ''));

        $links = $profile->links()
            ->where('status', '!=', GymLinkStatus::Declined)
            ->with(array_map(fn (string $relation) => "trainerProfile.{$relation}", TrainerCard::RELATIONS))
            ->latest('updated_at')
            ->get()
            // Requests of trainers not approved yet: the gym sees them after the approval.
            ->filter(fn (GymTrainerLink $link) => $link->trainerProfile->status === TrainerProfileStatus::Approved);

        return Inertia::render('gym/trainers', [
            'gymArea' => $this->gymArea(),
            'approved' => $profile->isApproved(),
            'trainers' => $this->rows($links->where('status', GymLinkStatus::Accepted)),
            'requests' => $this->rows($links->filter(fn (GymTrainerLink $link) => $link->awaits(GymLinkSide::Gym))),
            'invites' => $this->rows($links->filter(fn (GymTrainerLink $link) => $link->awaits(GymLinkSide::Trainer))),
            'query' => $query,
            'results' => mb_strlen($query) >= 2 ? $this->search($profile, $query) : [],
            'maxMessage' => GymLinks::MESSAGE_MAX,
        ]);
    }

    public function invite(Request $request, GymLinks $links): RedirectResponse
    {
        $profile = $this->gymOrFail();
        $data = $request->validate([
            'trainer' => ['required', 'string'],
            'message' => ['nullable', 'string', 'max:'.GymLinks::MESSAGE_MAX],
        ]);

        $trainer = TrainerProfile::where('slug', $data['trainer'])->firstOrFail();
        $links->invite($profile, $trainer, $data['message'] ?? null);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Invito inviato.']);

        return to_route('gym.trainers');
    }

    public function accept(GymTrainerLink $link, GymLinks $links): RedirectResponse
    {
        $links->accept($this->linkOf($link), GymLinkSide::Gym);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Trainer aggiunto alla palestra.']);

        return to_route('gym.trainers');
    }

    public function decline(GymTrainerLink $link, GymLinks $links): RedirectResponse
    {
        $links->decline($this->linkOf($link), GymLinkSide::Gym);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Richiesta rifiutata.']);

        return to_route('gym.trainers');
    }

    public function destroy(GymTrainerLink $link, GymLinks $links): RedirectResponse
    {
        $links->remove($this->linkOf($link), GymLinkSide::Gym);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Fatto.']);

        return to_route('gym.trainers');
    }

    private function linkOf(GymTrainerLink $link): GymTrainerLink
    {
        abort_if($link->gym_profile_id !== $this->gymOrFail()->id, 404);

        return $link;
    }

    /**
     * @param  Collection<int, GymTrainerLink>  $links
     * @return list<array<string, mixed>>
     */
    private function rows(Collection $links): array
    {
        return array_values($links->map(fn (GymTrainerLink $link) => [
            'id' => $link->id,
            'message' => $link->message,
            'trainer' => TrainerCard::from($link->trainerProfile),
        ])->all());
    }

    /**
     * Approved trainers by name, the ones of the gym's city first. The ones
     * already here or asked are left out.
     *
     * @return list<array<string, mixed>>
     */
    private function search(GymProfile $profile, string $query): array
    {
        $linked = $profile->links()->where('status', '!=', GymLinkStatus::Declined)->pluck('trainer_profile_id');
        $like = '%'.addcslashes(mb_strtolower($query), '%_\\').'%';

        return array_values(TrainerProfile::query()
            ->where('status', TrainerProfileStatus::Approved)
            ->whereHas('user', fn (Builder $user) => $user->active()
                ->whereRaw("lower(first_name || ' ' || last_name) like ? escape '\\'", [$like]))
            ->whereNotIn('id', $linked)
            ->with(TrainerCard::RELATIONS)
            ->orderByRaw('CASE WHEN city_id = ? THEN 0 ELSE 1 END', [$profile->city_id])
            ->limit(10)
            ->get()
            ->map(fn (TrainerProfile $trainer) => TrainerCard::from($trainer))
            ->all());
    }
}
