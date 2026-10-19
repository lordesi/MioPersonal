<?php

namespace App\Http\Controllers;

use App\Http\Requests\ClientPreferencesRequest;
use App\Models\City;
use App\Models\ClientPreference;
use App\Models\Discipline;
use App\Models\User;
use App\Support\CatalogOptions;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Completa il tuo profilo": right after the client sign-up (full screen), and
 * "Modifica il mio profilo" in the client area to change the answers later.
 * Saved in `client_preferences` and, for the photo, in `users.avatar_path`.
 */
class CompleteProfileController extends Controller
{
    public function show(Request $request): Response
    {
        return Inertia::render('onboarding/complete-profile', $this->pageData($request));
    }

    /** "Modifica il mio profilo": the same form, inside the client area. */
    public function edit(Request $request): Response
    {
        return Inertia::render('client/edit-profile', $this->pageData($request));
    }

    public function update(ClientPreferencesRequest $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        // The page sends slugs: the table keeps the ids, in the client's order.
        $disciplineSlugs = $request->array('disciplines');
        $disciplineIds = Discipline::query()->whereIn('slug', $disciplineSlugs)->pluck('id', 'slug');

        $user->clientPreference()->updateOrCreate([], [
            'city_id' => $request->filled('city')
                ? City::query()->where('slug', $request->string('city'))->value('id')
                : null,
            'mode' => $request->input('mode'),
            'goal' => $request->input('goal'),
            'times' => $request->array('times'),
            'discipline_ids' => array_map(fn (string $slug) => $disciplineIds[$slug], $disciplineSlugs),
            'budget_max_cents' => $request->filled('budget_max_cents') ? $request->integer('budget_max_cents') : null,
        ]);

        // "Modifica il mio profilo" stays on the page; the sign-up goes on to the dashboard.
        if ($request->routeIs('client.profile.update')) {
            Inertia::flash('toast', ['type' => 'success', 'message' => 'Profilo aggiornato.']);

            return back();
        }

        return to_route('client.home');
    }

    /** "Carica una foto": saved right away, the old photo is deleted. */
    public function updatePhoto(Request $request): RedirectResponse
    {
        $request->validate([
            'photo' => ['required', 'image', 'mimes:jpg,jpeg,png', 'max:5120'],
        ], [
            'photo.required' => 'Scegli una foto.',
            'photo.image' => 'La foto deve essere un’immagine JPG o PNG.',
            'photo.mimes' => 'La foto deve essere un’immagine JPG o PNG.',
            'photo.max' => 'La foto può pesare al massimo 5 MB.',
            // Almost always a file over the PHP limit (upload_max_filesize).
            'photo.uploaded' => 'La foto è troppo pesante: massimo 5 MB.',
        ]);

        /** @var User $user */
        $user = $request->user();
        $oldPath = $user->avatar_path;

        // A random name, so the address can't be guessed.
        $path = $request->file('photo')->store("avatars/{$user->id}", User::AVATAR_DISK);

        // Not fillable on purpose: only set here.
        $user->forceFill(['avatar_path' => $path])->save();

        if ($oldPath !== null) {
            Storage::disk(User::AVATAR_DISK)->delete($oldPath);
        }

        return back();
    }

    /** The X on the photo: deleted right away, the avatars show the initials again. */
    public function destroyPhoto(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->avatar_path !== null) {
            Storage::disk(User::AVATAR_DISK)->delete($user->avatar_path);
            $user->forceFill(['avatar_path' => null])->save();
        }

        return back();
    }

    /**
     * Props of both pages.
     *
     * @return array<string, mixed>
     */
    private function pageData(Request $request): array
    {
        /** @var User $user */
        $user = $request->user();

        return [
            'disciplines' => CatalogOptions::disciplines(),
            'cities' => CatalogOptions::citiesWithCoordinates(),
            'preferences' => $this->savedPreferences($user->clientPreference),
        ];
    }

    /**
     * The saved answers in the format of the page (slugs and enum values),
     * or null when the client never saved them.
     *
     * @return array<string, mixed>|null
     */
    private function savedPreferences(?ClientPreference $preference): ?array
    {
        if ($preference === null) {
            return null;
        }

        // Disciplines hidden by the team in the meantime are left out.
        $slugs = Discipline::query()->active()->whereIn('id', $preference->discipline_ids ?? [])->pluck('slug', 'id');

        return [
            'city' => $preference->city?->slug,
            'mode' => $preference->mode?->value,
            'goal' => $preference->goal?->value,
            'disciplines' => collect($preference->discipline_ids ?? [])
                ->filter(fn (int $id) => $slugs->has($id))
                ->map(fn (int $id) => $slugs[$id])
                ->values()
                ->all(),
            'times' => $preference->times?->map->value->all() ?? [],
            'budgetMaxCents' => $preference->budget_max_cents,
        ];
    }
}
