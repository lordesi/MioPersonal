<?php

namespace App\Http\Controllers;

use App\Actions\Fortify\CreateNewUser;
use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Diventa trainer": guests create a trainer account, logged-in clients turn
 * their own account into a trainer one. Trainers and admins go to their area.
 */
class TrainerRegistrationController extends Controller
{
    /** The 7-step registration; after sending it shows "Profilo inviato". */
    public function show(Request $request): Response|RedirectResponse
    {
        $submitted = $request->session()->get('status') === 'trainer-registered';
        $user = $request->user();

        if ($user !== null && $user->role !== UserRole::Client && ! $submitted) {
            return to_route($user->role->homeRoute());
        }

        return Inertia::render('onboarding/trainer-registration', [
            'submitted' => $submitted,
            // A logged-in client keeps the account: step 1 only asks for the trainer terms.
            'account' => $user?->role === UserRole::Client
                ? ['name' => $user->name, 'email' => $user->email]
                : null,
        ]);
    }

    /**
     * TODO: save the public profile, services, hours and certifications
     * (steps 2–7) once the trainer tables exist. New trainer profiles must stay
     * hidden from the search until the team approves them.
     */
    public function store(Request $request, CreateNewUser $creator): RedirectResponse
    {
        $user = $request->user();

        if ($user === null) {
            // Same rules as the client sign-up.
            $user = $creator->create($request->only(['first_name', 'last_name', 'email', 'password', 'terms']));
            $this->makeTrainer($user);

            event(new Registered($user));

            Auth::login($user);
            $request->session()->regenerate();
        } elseif ($user->role === UserRole::Client) {
            $request->validate(['terms' => ['accepted']]);
            $this->makeTrainer($user);
        } else {
            return to_route($user->role->homeRoute());
        }

        return to_route('trainer.register')->with('status', 'trainer-registered');
    }

    /** `role` is not fillable on purpose: it is set only here and by `admin:grant`. */
    private function makeTrainer(User $user): void
    {
        $user->role = UserRole::Trainer;
        $user->save();
    }
}
