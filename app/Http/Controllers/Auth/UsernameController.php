<?php

namespace App\Http\Controllers\Auth;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Rules\Username;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Scegli il tuo username": accounts from before the usernames got one
 * automatically and confirm it here once (EnsureUsernameChosen sends them).
 * After that it can't be changed, like the one chosen at sign-up.
 */
class UsernameController extends Controller
{
    public function show(Request $request): Response|RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->hasChosenUsername()) {
            return to_route($user->role->homeRoute());
        }

        return Inertia::render('auth/choose-username', [
            'username' => $user->username,
            // The link shown under the field: only trainers and gyms have a public page.
            'linkPrefix' => self::linkPrefix($user->role),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->hasChosenUsername()) {
            return to_route($user->role->homeRoute());
        }

        $request->merge(['username' => Username::normalize($request->input('username'))]);
        $request->validate(['username' => ['required', 'string', new Username($user->id)]]);
        $username = $request->string('username')->value();

        DB::transaction(function () use ($user, $username) {
            $user->forceFill(['username' => $username, 'username_chosen_at' => now()])->save();

            foreach ([$user->trainerProfile, $user->gymProfile] as $profile) {
                if ($profile === null || $profile->slug === $username) {
                    continue;
                }

                // The link already shared keeps working; the oldest one is the one on the QR codes.
                $profile->forceFill([
                    'legacy_slug' => $profile->legacy_slug ?? $profile->slug,
                    'slug' => $username,
                ])->save();
            }
        });

        return redirect()->intended(route($user->role->homeRoute()))->with('status', 'username-chosen');
    }

    /**
     * The username field of every form checks it while typing: free, valid,
     * not reserved. The user's own username counts as free.
     */
    public function check(Request $request): JsonResponse
    {
        $request->validate(['value' => ['nullable', 'string', 'max:255']]);

        $username = Username::normalize($request->string('value')->value());
        $validator = Validator::make(['username' => $username], ['username' => ['required', new Username($request->user()?->id)]]);

        return response()->json([
            'username' => $username,
            'error' => $validator->fails() ? $validator->errors()->first('username') : null,
        ]);
    }

    /** "miopersonal.it/trainer/" for trainers, "…/palestra/" for gyms, null for the others. */
    public static function linkPrefix(?UserRole $role): ?string
    {
        $route = match ($role) {
            UserRole::Trainer => 'trainers.show',
            UserRole::Gym => 'gyms.show',
            default => null,
        };

        return $route === null ? null : (string) preg_replace('~^https?://(www\.)?|__$~', '', route($route, '__'));
    }
}
