<?php

namespace App\Http\Controllers;

use App\Actions\GroupSessions\CancelGroupSession;
use App\Actions\GroupSessions\GroupSessionHosts;
use App\Actions\GroupSessions\GroupSessionPlaces;
use App\Actions\GroupSessions\SaveGroupSession;
use App\Enums\GroupSessionPlace;
use App\Enums\GroupSessionStatus;
use App\Enums\GroupSessionType;
use App\Enums\GymLinkStatus;
use App\Enums\RegistrationStatus;
use App\Http\Controllers\Concerns\BuildsGymArea;
use App\Http\Controllers\Concerns\BuildsPlaceholderData;
use App\Http\Requests\GroupSessionRequest;
use App\Models\City;
use App\Models\Discipline;
use App\Models\GroupSession;
use App\Models\GroupSessionHost;
use App\Models\GroupSessionRegistration;
use App\Models\GymProfile;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Support\BookingMailData;
use App\Support\GroupSessionCard;
use App\Support\TrainerSlots;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Eventi" of the trainer area and of the gym area: the same pages, each in
 * its own layout (trainer/events…, gym/events…). The owner of an event
 * changes, cancels and deletes it and invites co-organizers; every
 * organizer sees the clients and sets the places left.
 * A lesson of a course opens here too, for its clients and places.
 */
class OrganizerEventsController extends Controller
{
    use BuildsGymArea, BuildsPlaceholderData;

    public function index(Request $request): Response
    {
        $profile = $this->organizer($request);
        $hosted = fn () => GroupSessionCard::load(GroupSession::query()->hostedBy($profile)->whereNull('gym_course_lesson_id'));

        $invites = GroupSessionHost::query()
            ->where(self::column($profile), $profile->id)
            ->where('status', GymLinkStatus::Pending)
            ->whereHas('groupSession', fn (Builder $session) => $session->upcoming()->where('status', GroupSessionStatus::Published))
            ->with(['groupSession' => fn ($session) => GroupSessionCard::load($session)])
            ->get()
            // One per series: the first date.
            ->sortBy(fn (GroupSessionHost $host) => $host->groupSession->starts_at)
            ->unique(fn (GroupSessionHost $host) => $host->groupSession->series_id ?? 'session-'.$host->group_session_id)
            ->values();

        return $this->render($request, 'events', [
            'upcoming' => GroupSessionCard::many($hosted()->upcoming()->orderBy('starts_at')->limit(60)->get()),
            'past' => GroupSessionCard::many($hosted()->where('starts_at', '<=', now())->orderByDesc('starts_at')->limit(20)->get()),
            'invites' => $invites->map(fn (GroupSessionHost $host) => [
                'id' => $host->id,
                'from' => $host->groupSession->owner()?->name(),
                'dates' => $host->groupSession->series_id === null ? 1 : GroupSessionHost::query()
                    ->where(self::column($profile), $profile->id)
                    ->where('status', GymLinkStatus::Pending)
                    ->whereHas('groupSession', fn (Builder $session) => $session->where('series_id', $host->groupSession->series_id)->upcoming())
                    ->count(),
                'event' => GroupSessionCard::from($host->groupSession),
            ])->all(),
            'approved' => $profile->isApproved(),
        ]);
    }

    public function create(Request $request): Response
    {
        $this->organizer($request);

        return $this->render($request, 'event-form', [
            'event' => null,
            ...$this->formOptions($request),
        ]);
    }

    public function store(GroupSessionRequest $request, SaveGroupSession $save): RedirectResponse
    {
        $profile = $this->organizer($request);
        abort_unless($profile->isApproved(), 403, 'Potrai creare eventi quando il tuo profilo sarà approvato.');

        /** @var User $user */
        $user = $request->user();
        $cover = $request->file('cover');
        $session = $save->create($profile, $user, $request->validated(), $cover instanceof UploadedFile ? $cover : null);
        $dates = max(1, (int) $request->validated('dates', 1));

        Inertia::flash('toast', ['type' => 'success', 'message' => $dates > 1 ? "Evento pubblicato: {$dates} date." : 'Evento pubblicato.']);

        return to_route($this->area($request).'.events.show', $session);
    }

    public function show(Request $request, GroupSession $session): Response
    {
        $host = $this->hostOrFail($request, $session);
        $profile = $this->organizer($request);
        $query = trim((string) $request->query('q', ''));
        $session->loadMissing(GroupSessionCard::RELATIONS)->loadCount('activeRegistrations as registered_count');

        $registrations = $session->registrations()
            ->whereIn('status', [RegistrationStatus::Registered, RegistrationStatus::Removed, RegistrationStatus::Cancelled])
            ->with('user')
            ->orderBy('created_at')
            ->get();

        $following = $session->series_id === null ? 1 : $session->series()->where('starts_at', '>=', $session->starts_at)->where('status', GroupSessionStatus::Published)->count();

        return $this->render($request, 'event', [
            'event' => [
                ...GroupSessionCard::from($session),
                'description' => $session->description,
                'offlineSeats' => $session->offline_seats,
                'registered' => $session->registeredCount(),
                'started' => $session->hasStarted(),
                'lesson' => $session->isLesson(),
                'cancelNote' => $session->cancel_note,
                // Other dates of the series, from this one on.
                'following' => $following,
                'inSeries' => $session->series_id !== null,
            ],
            'isOwner' => $host->is_owner,
            'myHostId' => $host->id,
            'registrations' => $registrations->map(fn (GroupSessionRegistration $registration) => [
                'id' => $registration->id,
                'name' => $registration->user->name,
                'email' => $registration->user->email,
                'phone' => BookingMailData::phone($registration->user->phone),
                'status' => $registration->status->value,
                'at' => $this->iso($registration->updated_at ?? now()->toImmutable()),
            ])->values(),
            'hosts' => $session->hosts->sortByDesc('is_owner')->map(fn (GroupSessionHost $item) => [
                'id' => $item->id,
                'name' => $item->name(),
                'kind' => $item->trainer_profile_id !== null ? 'trainer' : 'gym',
                'isOwner' => $item->is_owner,
                'status' => $item->status->value,
                'isMe' => $item->id === $host->id,
            ])->values(),
            'maxHosts' => GroupSession::MAX_HOSTS,
            'query' => $query,
            'results' => $host->is_owner && ! $session->isLesson() && mb_strlen($query) >= 2 ? $this->searchHosts($session, $profile, $query) : [],
        ]);
    }

    public function edit(Request $request, GroupSession $session): Response
    {
        $this->ownerOrFail($request, $session);
        $start = $session->starts_at->setTimezone(TrainerSlots::TIMEZONE);
        $end = $session->ends_at->setTimezone(TrainerSlots::TIMEZONE);

        return $this->render($request, 'event-form', [
            'event' => [
                'id' => $session->id,
                'type' => $session->type->value,
                'title' => $session->title,
                'description' => $session->description ?? '',
                'disciplineId' => $session->discipline_id,
                'place' => $session->place->value,
                'gymProfileId' => $session->gym_profile_id,
                'address' => $session->address ?? '',
                'cityId' => $session->city_id,
                'date' => $start->toDateString(),
                'start' => $start->format('H:i'),
                'end' => $end->format('H:i'),
                'capacity' => $session->capacity,
                'price' => $session->price_cents === 0 ? '0' : str_replace('.', ',', (string) ($session->price_cents / 100)),
                'coverUrl' => $session->coverUrl(),
                'registered' => $session->activeRegistrations()->count(),
                'inSeries' => $session->series_id !== null,
                'href' => route($this->area($request).'.events.show', $session, false),
            ],
            ...$this->formOptions($request),
        ]);
    }

    public function update(GroupSessionRequest $request, GroupSession $session, SaveGroupSession $save): RedirectResponse
    {
        $this->ownerOrFail($request, $session);
        abort_if($session->hasStarted() || $session->isCancelled(), 403, 'Questo evento non si può più modificare.');

        $cover = $request->file('cover');
        $save->update(
            $session,
            $request->validated(),
            $request->validated('scope') ?? SaveGroupSession::SCOPE_THIS,
            $cover instanceof UploadedFile ? $cover : null,
            $request->boolean('remove_cover'),
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Evento salvato.']);

        return to_route($this->area($request).'.events.show', $session);
    }

    public function cancel(Request $request, GroupSession $session, CancelGroupSession $cancel): RedirectResponse
    {
        $this->ownerOrFail($request, $session);
        $data = $request->validate([
            'scope' => ['nullable', Rule::in([SaveGroupSession::SCOPE_THIS, SaveGroupSession::SCOPE_FOLLOWING])],
            'note' => ['nullable', 'string', 'max:200'],
        ], ['note.max' => 'Il messaggio può avere al massimo 200 caratteri.']);

        $count = $cancel->cancel($session, $data['scope'] ?? SaveGroupSession::SCOPE_THIS, $data['note'] ?? null);

        Inertia::flash('toast', ['type' => 'success', 'message' => $count > 1 ? "{$count} date annullate: gli iscritti sono stati avvisati." : 'Evento annullato: gli iscritti sono stati avvisati.']);

        return back();
    }

    public function destroy(Request $request, GroupSession $session, CancelGroupSession $cancel): RedirectResponse
    {
        $this->ownerOrFail($request, $session);
        $data = $request->validate(['scope' => ['nullable', Rule::in([SaveGroupSession::SCOPE_THIS, SaveGroupSession::SCOPE_FOLLOWING])]]);

        $count = $cancel->delete($session, $data['scope'] ?? SaveGroupSession::SCOPE_THIS);

        Inertia::flash('toast', ['type' => 'success', 'message' => $count > 1 ? "{$count} date eliminate." : 'Evento eliminato.']);

        return to_route($this->area($request).'.events');
    }

    /** "Posti rimasti": the people who booked outside the app take the others. */
    public function seats(Request $request, GroupSession $session, GroupSessionPlaces $places): RedirectResponse
    {
        $this->hostOrFail($request, $session);
        $data = $request->validate(['remaining' => ['required', 'integer', 'min:0']], ['remaining.*' => 'Scrivi quanti posti restano.']);

        $places->setRemaining($session, (int) $data['remaining']);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Posti rimasti aggiornati.']);

        return back();
    }

    public function removeRegistration(Request $request, GroupSession $session, GroupSessionRegistration $registration, GroupSessionPlaces $places): RedirectResponse
    {
        $this->hostOrFail($request, $session);
        abort_unless($registration->group_session_id === $session->id, 404);

        $places->remove($registration);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Iscrizione annullata: il cliente è stato avvisato.']);

        return back();
    }

    public function invite(Request $request, GroupSession $session, GroupSessionHosts $hosts): RedirectResponse
    {
        $this->ownerOrFail($request, $session);
        abort_if($session->isLesson() || ! $session->isOpen(), 403);

        $data = $request->validate([
            'kind' => ['required', Rule::in(['trainer', 'gym'])],
            'slug' => ['required', 'string', 'max:120'],
        ]);

        $profile = $data['kind'] === 'trainer'
            ? TrainerProfile::query()->approved()->where('slug', $data['slug'])->firstOrFail()
            : GymProfile::query()->approved()->where('slug', $data['slug'])->firstOrFail();

        $hosts->invite($session, $profile);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Invito inviato.']);

        return back();
    }

    /** The owner takes a co-organizer off, or a co-organizer leaves. */
    public function removeHost(Request $request, GroupSession $session, GroupSessionHost $host, GroupSessionHosts $hosts): RedirectResponse
    {
        $mine = $this->hostOrFail($request, $session);
        abort_unless($host->group_session_id === $session->id && ($mine->is_owner || $mine->id === $host->id), 404);

        $hosts->remove($host);

        Inertia::flash('toast', ['type' => 'success', 'message' => $mine->id === $host->id ? 'Non sei più tra gli organizzatori.' : 'Organizzatore tolto.']);

        return $mine->id === $host->id ? to_route($this->area($request).'.events') : back();
    }

    public function accept(Request $request, GroupSessionHost $host, GroupSessionHosts $hosts): RedirectResponse
    {
        $hosts->answer($this->inviteOf($request, $host), true);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Invito accettato: l’evento compare nel tuo profilo.']);

        return to_route($this->area($request).'.events.show', $host->group_session_id);
    }

    public function decline(Request $request, GroupSessionHost $host, GroupSessionHosts $hosts): RedirectResponse
    {
        $hosts->answer($this->inviteOf($request, $host), false);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Invito rifiutato.']);

        return to_route($this->area($request).'.events');
    }

    /**
     * @param  array<string, mixed>  $props
     */
    private function render(Request $request, string $page, array $props): Response
    {
        $area = $this->area($request);

        return Inertia::render("{$area}/{$page}", [
            ...($area === 'gym' ? ['gymArea' => $this->gymArea()] : ['trainerArea' => $this->trainerArea()]),
            'area' => $area,
            ...$props,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function formOptions(Request $request): array
    {
        /** @var User $user */
        $user = $request->user();
        $gymIds = GroupSessionRequest::gymIds($user);

        return [
            'types' => GroupSessionType::options(),
            'places' => array_map(fn (GroupSessionPlace $place) => ['value' => $place->value, 'label' => $place->label()], GroupSessionPlace::cases()),
            'gyms' => GymProfile::query()->whereKey($gymIds)->with('city')->orderBy('name')->get()
                ->map(fn (GymProfile $gym) => ['value' => (string) $gym->id, 'label' => "{$gym->name} · {$gym->city->name}"])->values(),
            'disciplines' => Discipline::query()->active()->orderBy('sort')->orderBy('name')->get(['id', 'name'])
                ->map(fn (Discipline $discipline) => ['value' => (string) $discipline->id, 'label' => $discipline->name])->values(),
            'cities' => City::query()->active()->orderBy('name')->get(['id', 'name'])
                ->map(fn (City $city) => ['value' => (string) $city->id, 'label' => $city->name])->values(),
            'maxDates' => GroupSession::MAX_DATES,
            'maxCapacity' => GroupSession::MAX_CAPACITY,
            'approved' => $this->organizer($request)->isApproved(),
        ];
    }

    /**
     * Approved trainers and gyms by name, not already organizers.
     *
     * @return list<array{kind: string, slug: string, name: string, city: string|null}>
     */
    private function searchHosts(GroupSession $session, TrainerProfile|GymProfile $profile, string $query): array
    {
        $like = '%'.addcslashes(mb_strtolower($query), '%_\\').'%';
        $taken = $session->hosts->where('status', '!=', GymLinkStatus::Declined);

        $trainers = TrainerProfile::query()
            ->approved()
            ->whereNotIn('id', $taken->pluck('trainer_profile_id')->filter()->values())
            ->whereHas('user', fn (Builder $user) => $user->whereRaw("lower(first_name || ' ' || last_name) like ? escape '\\'", [$like]))
            ->with(['user', 'city'])
            ->limit(6)
            ->get()
            ->map(fn (TrainerProfile $trainer) => ['kind' => 'trainer', 'slug' => $trainer->slug, 'name' => $trainer->user->name, 'city' => $trainer->city?->name]);

        $gyms = GymProfile::query()
            ->approved()
            ->whereNotIn('id', $taken->pluck('gym_profile_id')->filter()->values())
            ->whereRaw("lower(name) like ? escape '\\'", [$like])
            ->with('city')
            ->limit(6)
            ->get()
            ->map(fn (GymProfile $gym) => ['kind' => 'gym', 'slug' => $gym->slug, 'name' => $gym->name, 'city' => $gym->city->name]);

        return [...$trainers->all(), ...$gyms->all()];
    }

    /** 'trainer' or 'gym': the area of the route. */
    private function area(Request $request): string
    {
        return str_starts_with((string) $request->route()?->getName(), 'gym.') ? 'gym' : 'trainer';
    }

    private function organizer(Request $request): TrainerProfile|GymProfile
    {
        /** @var User $user */
        $user = $request->user();
        $profile = $this->area($request) === 'gym' ? $user->gymProfile : $user->trainerProfile;

        abort_if($profile === null, 404);

        return $profile;
    }

    private function hostOrFail(Request $request, GroupSession $session): GroupSessionHost
    {
        $profile = $this->organizer($request);
        $session->loadMissing('hosts.trainerProfile.user', 'hosts.gymProfile');

        $host = $session->hosts->first(fn (GroupSessionHost $host) => $host->isAccepted() && $host->{self::column($profile)} === $profile->id);

        abort_if($host === null, 404);

        return $host;
    }

    private function ownerOrFail(Request $request, GroupSession $session): GroupSessionHost
    {
        $host = $this->hostOrFail($request, $session);

        abort_unless($host->is_owner && ! $session->isLesson(), 403, 'Solo chi ha creato l’evento può farlo.');

        return $host;
    }

    private function inviteOf(Request $request, GroupSessionHost $host): GroupSessionHost
    {
        $profile = $this->organizer($request);

        abort_unless($host->{self::column($profile)} === $profile->id && $host->isPending(), 404);

        return $host;
    }

    private static function column(TrainerProfile|GymProfile $profile): string
    {
        return $profile instanceof TrainerProfile ? 'trainer_profile_id' : 'gym_profile_id';
    }
}
