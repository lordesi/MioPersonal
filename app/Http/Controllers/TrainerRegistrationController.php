<?php

namespace App\Http\Controllers;

use App\Actions\Fortify\CreateNewUser;
use App\Actions\Trainer\SaveTrainerProfile;
use App\Enums\TrainerProfileStatus;
use App\Enums\TrainerReviewDecision;
use App\Enums\UserRole;
use App\Http\Requests\TrainerProfileRequest;
use App\Http\Requests\TrainerRegistrationStepRequest;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Support\CatalogOptions;
use App\Support\TrainerDraft;
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
            'draft' => $profile === null ? null : TrainerDraft::fromProfile($profile),
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
                $user = $creator->create($request->only(['first_name', 'last_name', 'email', 'phone', 'password', 'terms']));
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
     * "Continua": the fields of the step being left are checked now, so their
     * errors show up in that step. Nothing is saved: everything goes with "Invia".
     */
    public function check(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user !== null && ! $this->canSend($user)) {
            return to_route($user->role->homeRoute());
        }

        // With errors, Laravel goes back to the page with them.
        app(TrainerRegistrationStepRequest::class);

        return to_route('trainer.register');
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
