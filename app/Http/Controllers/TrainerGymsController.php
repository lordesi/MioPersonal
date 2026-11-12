<?php

namespace App\Http\Controllers;

use App\Actions\Gym\GymLinks;
use App\Enums\GymLinkSide;
use App\Enums\GymLinkStatus;
use App\Http\Controllers\Concerns\BuildsPlaceholderData;
use App\Models\GymCourse;
use App\Models\GymProfile;
use App\Models\GymTrainerLink;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Support\CourseCard;
use App\Support\GymCard;
use App\Support\GymCourseWeek;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Palestre" of the trainer area: the gyms where the trainer works, the
 * invitations to answer, the requests sent, and the search to ask a gym.
 */
class TrainerGymsController extends Controller
{
    use BuildsPlaceholderData;

    public function show(Request $request): Response
    {
        $trainer = $this->trainer($request);
        $query = trim((string) $request->query('q', ''));

        $links = $trainer === null ? collect() : $trainer->gymLinks()
            ->where('status', '!=', GymLinkStatus::Declined)
            ->with(array_map(fn (string $relation) => "gymProfile.{$relation}", GymCard::RELATIONS))
            ->latest('updated_at')
            ->get();

        return Inertia::render('trainer/gyms', [
            'trainerArea' => $this->trainerArea(),
            'gyms' => $this->rows($links->where('status', GymLinkStatus::Accepted), $this->taughtCourses($trainer)),
            'invites' => $this->rows($links->filter(fn (GymTrainerLink $link) => $link->awaits(GymLinkSide::Trainer))),
            'requests' => $this->rows($links->filter(fn (GymTrainerLink $link) => $link->awaits(GymLinkSide::Gym))),
            'query' => $query,
            'results' => $trainer !== null && mb_strlen($query) >= 2 ? $this->search($trainer, $query) : [],
            'approved' => $trainer?->isApproved() ?? false,
            'max' => GymLinks::MAX_GYMS_PER_TRAINER,
            'maxMessage' => GymLinks::MESSAGE_MAX,
        ]);
    }

    /** "Chiedi di allenare qui". */
    public function request(Request $request, string $slug, GymLinks $links): RedirectResponse
    {
        $trainer = $this->trainer($request);
        abort_if($trainer === null, 404);

        $data = $request->validate(['message' => ['nullable', 'string', 'max:'.GymLinks::MESSAGE_MAX]]);
        $gym = GymProfile::where('slug', $slug)->firstOrFail();
        $links->request($trainer, $gym, $data['message'] ?? null);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Richiesta inviata alla palestra.']);

        return back();
    }

    public function accept(Request $request, GymTrainerLink $link, GymLinks $links): RedirectResponse
    {
        $links->accept($this->linkOf($request, $link), GymLinkSide::Trainer);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Palestra aggiunta al tuo profilo.']);

        return to_route('trainer.gyms');
    }

    public function decline(Request $request, GymTrainerLink $link, GymLinks $links): RedirectResponse
    {
        $links->decline($this->linkOf($request, $link), GymLinkSide::Trainer);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Invito rifiutato.']);

        return to_route('trainer.gyms');
    }

    public function destroy(Request $request, GymTrainerLink $link, GymLinks $links): RedirectResponse
    {
        $links->remove($this->linkOf($request, $link), GymLinkSide::Trainer);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Fatto.']);

        return to_route('trainer.gyms');
    }

    private function trainer(Request $request): ?TrainerProfile
    {
        /** @var User $user */
        $user = $request->user();

        return $user->trainerProfile;
    }

    private function linkOf(Request $request, GymTrainerLink $link): GymTrainerLink
    {
        abort_if($link->trainer_profile_id !== $this->trainer($request)?->id, 404);

        return $link;
    }

    /**
     * @param  Collection<int, GymTrainerLink>  $links
     * @param  array<int, list<array<string, mixed>>>  $courses  "Corsi che tieni qui", by gym id
     * @return list<array<string, mixed>>
     */
    private function rows(Collection $links, array $courses = []): array
    {
        return array_values($links->map(fn (GymTrainerLink $link) => [
            'id' => $link->id,
            'message' => $link->message,
            'gym' => GymCard::from($link->gymProfile),
            'courses' => $courses[$link->gym_profile_id] ?? [],
        ])->all());
    }

    /**
     * The courses the gyms say the trainer teaches, by gym id.
     *
     * @return array<int, list<array<string, mixed>>>
     */
    private function taughtCourses(?TrainerProfile $trainer): array
    {
        if ($trainer === null) {
            return [];
        }

        $courses = GymCourse::query()
            ->where('instructor_trainer_id', $trainer->id)
            ->where('is_active', true)
            ->whereHas('lessons')
            ->with(['lessons', 'gymProfile:id,slug'])
            ->orderBy('name')
            ->get();
        $byGym = [];

        foreach ($courses as $course) {
            $byGym[$course->gym_profile_id][] = [
                'id' => $course->id,
                'name' => $course->name,
                'when' => GymCourseWeek::when($course),
                'href' => CourseCard::href($course),
            ];
        }

        return $byGym;
    }

    /**
     * Approved gyms by name, the ones of the trainer's cities first; the ones
     * already linked or asked are left out.
     *
     * @return list<array<string, mixed>>
     */
    private function search(TrainerProfile $trainer, string $query): array
    {
        $linked = $trainer->gymLinks()->where('status', '!=', GymLinkStatus::Declined)->pluck('gym_profile_id');
        $like = '%'.addcslashes(mb_strtolower($query), '%_\\').'%';

        return array_values(GymProfile::query()
            ->approved()
            ->whereRaw("lower(name) like ? escape '\\'", [$like])
            ->whereNotIn('id', $linked)
            ->with(GymCard::RELATIONS)
            ->orderByRaw('CASE WHEN city_id = ? THEN 0 ELSE 1 END', [$trainer->city_id ?? 0])
            ->orderBy('name')
            ->limit(10)
            ->get()
            ->map(fn (GymProfile $gym) => GymCard::from($gym))
            ->all());
    }
}
