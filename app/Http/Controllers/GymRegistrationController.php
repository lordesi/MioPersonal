<?php

namespace App\Http\Controllers;

use App\Actions\Fortify\CreateNewUser;
use App\Actions\Gym\SaveGymProfile;
use App\Enums\GymAmenity;
use App\Enums\TrainerProfileStatus;
use App\Enums\TrainerReviewDecision;
use App\Enums\UserRole;
use App\Http\Controllers\Auth\UsernameController;
use App\Http\Requests\GymProfileRequest;
use App\Http\Requests\GymRegistrationStepRequest;
use App\Models\GymProfile;
use App\Models\User;
use App\Support\CatalogOptions;
use App\Support\GymDraft;
use App\Support\Seo;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Registra la tua palestra": guests create a gym account with its profile.
 * A gym opens it again to fix the profile when the team asks for changes (or
 * to finish it, if it was never sent). The profile stays hidden from the site
 * until the team approves it. Clients and trainers keep their accounts: a gym
 * needs its own (another email).
 */
class GymRegistrationController extends Controller
{
    /** The 5-step registration; after sending it shows "Profilo inviato". */
    public function show(Request $request): Response|RedirectResponse
    {
        $submitted = $request->session()->get('status') === 'gym-registered';
        $user = $request->user();

        // Clients and trainers are told a gym needs its own account, and can sign out to make it.
        $otherAccount = $user !== null && ! $submitted && in_array($user->role, [UserRole::Client, UserRole::Trainer], true);

        if ($user !== null && ! $submitted && ! $otherAccount && ! $this->canSend($user)) {
            return to_route($user->role->homeRoute());
        }

        $profile = $user?->role === UserRole::Gym ? $user->gymProfile : null;

        return Inertia::render('onboarding/gym-registration', [
            'submitted' => $submitted,
            'otherAccount' => $otherAccount,
            'cities' => CatalogOptions::cities(),
            'amenities' => GymAmenity::options(),
            // A gym fixing the profile starts from step 2, with what was sent.
            'editing' => $user?->role === UserRole::Gym,
            'draft' => $profile === null ? null : GymDraft::fromProfile($profile),
            'changeRequest' => $profile === null ? null : $this->changeRequest($profile),
            'previewHref' => $profile === null ? null : route('gyms.show', $profile->slug, false),
            // Under the username of a guest: the link the page will have.
            'usernameLinkPrefix' => UsernameController::linkPrefix(UserRole::Gym),
            'seo' => Seo::page(
                title: 'Registra la tua palestra',
                description: 'Hai una palestra? Crea gratis il profilo su MioPersonal: foto, servizi, orari, abbonamenti, promozioni e i personal trainer che allenano da te.',
                index: $user === null && ! $submitted,
                canonical: route('gym.register'),
            ),
        ]);
    }

    public function store(Request $request, CreateNewUser $creator, SaveGymProfile $saver): RedirectResponse
    {
        $user = $request->user();

        if ($user !== null && ! $this->canSend($user)) {
            return to_route($user->role->homeRoute());
        }

        // Validated only now: who can't send the profile is redirected without errors.
        $data = app(GymProfileRequest::class)->validated();

        if ($user === null) {
            $user = DB::transaction(function () use ($request, $creator, $saver, $data) {
                $user = $creator->create($request->only(['first_name', 'last_name', 'username', 'email', 'phone', 'password', 'terms']));
                $this->makeGym($user);
                $saver->handle($user, $data);

                return $user;
            });

            event(new Registered($user));

            Auth::login($user);
            $request->session()->regenerate();
        } else {
            $saver->handle($user, $data);
        }

        return to_route('gym.register')->with('status', 'gym-registered');
    }

    /** "Esci e registra la palestra": a client or trainer signs out and starts as a guest. */
    public function switchAccount(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return to_route('gym.register');
    }

    /** "Continua": the fields of the step being left are checked now. Nothing is saved. */
    public function check(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user !== null && ! $this->canSend($user)) {
            return to_route($user->role->homeRoute());
        }

        app(GymRegistrationStepRequest::class);

        return to_route('gym.register');
    }

    /** Only guests, and gyms whose profile was never sent or needs changes. */
    private function canSend(User $user): bool
    {
        return $user->role === UserRole::Gym
            && in_array($user->gymProfile?->status, [null, TrainerProfileStatus::Changes], true);
    }

    /** `role` is not fillable on purpose. */
    private function makeGym(User $user): void
    {
        $user->role = UserRole::Gym;
        $user->save();
    }

    /**
     * What the team asked to fix, shown at the top of the page.
     *
     * @return array{reasons: list<string>, message: string|null}|null
     */
    private function changeRequest(GymProfile $profile): ?array
    {
        if ($profile->status !== TrainerProfileStatus::Changes) {
            return null;
        }

        $decision = $profile->decisions()->where('decision', TrainerReviewDecision::Changes)->first();

        return [
            'reasons' => $decision->reasons ?? [],
            'message' => $decision?->message_to_gym,
        ];
    }
}
