<?php

namespace App\Http\Controllers;

use App\Actions\Fortify\CreateNewUser;
use App\Actions\Trainer\SaveTrainerProfile;
use App\Enums\PlaceType;
use App\Enums\TrainerProfileStatus;
use App\Enums\TrainerReviewDecision;
use App\Enums\UserRole;
use App\Http\Requests\TrainerProfileRequest;
use App\Models\Service;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Support\CatalogOptions;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Diventa trainer": guests create a trainer account, logged-in clients turn
 * their own account into a trainer one. A trainer opens it again to fix the
 * profile when the team asks for changes (or to finish it, if it was never
 * sent). The profile stays hidden from the site until the team approves it.
 */
class TrainerRegistrationController extends Controller
{
    /** The 7-step registration; after sending it shows "Profilo inviato". */
    public function show(Request $request): Response|RedirectResponse
    {
        $submitted = $request->session()->get('status') === 'trainer-registered';
        $user = $request->user();

        if ($user !== null && ! $submitted && ! $this->canSend($user)) {
            return to_route($user->role->homeRoute());
        }

        $profile = $user?->role === UserRole::Trainer ? $user->trainerProfile : null;

        return Inertia::render('onboarding/trainer-registration', [
            'submitted' => $submitted,
            // Options of step 3.
            'disciplines' => CatalogOptions::disciplines(),
            'cities' => CatalogOptions::cities(),
            // A logged-in client keeps the account: step 1 only asks for the trainer terms.
            'account' => $user?->role === UserRole::Client
                ? ['name' => $user->name, 'email' => $user->email]
                : null,
            // A trainer fixing the profile starts from step 2, with what was sent.
            'editing' => $user?->role === UserRole::Trainer,
            'draft' => $profile === null ? null : $this->draft($profile),
            'changeRequest' => $profile === null ? null : $this->changeRequest($profile),
            'previewHref' => $profile === null ? null : route('trainers.show', $profile->slug, false),
        ]);
    }

    public function store(Request $request, CreateNewUser $creator, SaveTrainerProfile $saver): RedirectResponse
    {
        $user = $request->user();

        if ($user !== null && ! $this->canSend($user)) {
            return to_route($user->role->homeRoute());
        }

        // Validated only now: who can't send the profile is redirected without errors.
        $data = app(TrainerProfileRequest::class)->validated();

        if ($user === null) {
            $user = DB::transaction(function () use ($request, $creator, $saver, $data) {
                // Same rules as the client sign-up.
                $user = $creator->create($request->only(['first_name', 'last_name', 'email', 'phone_prefix', 'phone', 'password', 'terms']));
                $this->makeTrainer($user);
                $saver->handle($user, $data);

                return $user;
            });

            event(new Registered($user));

            Auth::login($user);
            $request->session()->regenerate();
        } else {
            DB::transaction(function () use ($user, $saver, $data) {
                $this->makeTrainer($user);
                $saver->handle($user, $data);
            });
        }

        return to_route('trainer.register')->with('status', 'trainer-registered');
    }

    /**
     * Clients can become trainers. Trainers can send the profile only if it was
     * never sent or the team asked for changes; then they wait for the team.
     */
    private function canSend(User $user): bool
    {
        return match ($user->role) {
            UserRole::Client => true,
            UserRole::Trainer => in_array($user->trainerProfile?->status, [null, TrainerProfileStatus::Changes], true),
            UserRole::Admin => false,
        };
    }

    /** `role` is not fillable on purpose: it is set only here, by "Chiudi il profilo" and by `admin:grant`. */
    private function makeTrainer(User $user): void
    {
        $user->role = UserRole::Trainer;
        $user->save();
    }

    /**
     * The saved profile in the format of the page (TrainerDraft in draft.ts).
     *
     * @return array<string, mixed>
     */
    private function draft(TrainerProfile $profile): array
    {
        $profile->load(['city', 'otherCities', 'disciplines', 'places', 'services', 'workingHours', 'documents', 'portrait']);

        $hours = array_fill(0, 7, []);

        foreach ($profile->workingHours as $range) {
            $hours[$range->weekday - 1] = [...$hours[$range->weekday - 1], ...$range->startHours()];
        }

        return [
            'headline' => $profile->headline,
            'bio' => $profile->bio,
            'experience' => $profile->experience->value,
            'photoUrl' => $profile->portrait?->url(),
            'disciplines' => $profile->disciplines->pluck('slug')->all(),
            'places' => $profile->places->pluck('type')->unique()->map(fn (PlaceType $type) => $type->value)->values()->all(),
            'studios' => $profile->places
                ->where('type', PlaceType::Studio)
                ->map(fn ($place) => ['name' => $place->name ?? '', 'address' => $place->address ?? ''])
                ->values()->all() ?: [['name' => '', 'address' => '']],
            'city' => $profile->city->slug ?? '',
            'otherCities' => $profile->otherCities->pluck('slug')->all(),
            'pricing' => $this->pricing($profile),
            'hours' => $hours,
            'rules' => [
                'noticeHours' => $profile->notice_hours,
                'bookingWindowDays' => $profile->booking_window_days,
                'breakMinutes' => $profile->break_minutes,
                // null = "Nessun limite".
                'maxSessionsPerDay' => $profile->max_sessions_per_day,
                'freeCancellationHours' => $profile->free_cancellation_hours,
            ],
            'sessionMinutes' => $profile->session_minutes,
            'autoConfirm' => $profile->auto_confirm,
            'certifications' => $profile->documents->where('type', 'certificate')->map(fn ($document) => [
                'id' => $document->id,
                'title' => $document->title,
                'issuer' => $document->issuer ?? '',
                'year' => $document->year === null ? '' : (string) $document->year,
                'hasFile' => $document->path !== null,
            ])->values()->all(),
        ];
    }

    /**
     * "Servizi e prezzi" in the format of the page (`pricing` in draft.ts),
     * read back from the rows written by SaveTrainerProfile::saveServices().
     *
     * @return array<string, mixed>
     */
    private function pricing(TrainerProfile $profile): array
    {
        $services = $profile->services->sortBy('sort');
        $single = $services->first(fn (Service $service) => $service->price_per_hour && ! $service->online_only);
        $online = $services->first(fn (Service $service) => $service->price_per_hour && $service->online_only);
        $first = $services->first(fn (Service $service) => $service->kind === 'session' && ! $service->price_per_hour);
        // Older profiles may have durations that can't be chosen any more (e.g. 45 min).
        $minutes = fn (int $value) => in_array($value, TrainerProfile::SESSION_MINUTES, true) ? $value : 60;

        return [
            'hourlyCents' => $single?->price_cents,
            'singleNote' => $single->note ?? '',
            'onlineSamePrice' => $online === null,
            'onlineHourlyCents' => $online?->price_cents,
            'onlineNote' => $online->note ?? '',
            'firstSession' => [
                'enabled' => $first !== null,
                'name' => $first->name ?? 'Prima seduta',
                'minutes' => $minutes($first->minutes ?? 60),
                'priceCents' => $first?->price_cents,
                'note' => $first->note ?? '',
            ],
            'packages' => $services->where('kind', 'package')->map(fn (Service $service) => [
                'sessions' => $service->package_sessions ?? 10,
                'minutes' => $minutes($service->minutes),
                'priceCents' => $service->price_cents,
                'note' => $service->note ?? '',
            ])->values()->all(),
        ];
    }

    /**
     * What the team asked to fix, shown at the top of the page.
     *
     * @return array{reasons: list<string>, message: string|null}|null
     */
    private function changeRequest(TrainerProfile $profile): ?array
    {
        if ($profile->status !== TrainerProfileStatus::Changes) {
            return null;
        }

        $decision = $profile->decisions()->where('decision', TrainerReviewDecision::Changes)->first();

        return [
            'reasons' => $decision->reasons ?? [],
            'message' => $decision?->message_to_trainer,
        ];
    }
}
