<?php

namespace App\Http\Controllers;

use App\Http\Requests\ClientPreferencesRequest;
use App\Models\City;
use App\Models\ClientPreference;
use App\Models\Discipline;
use App\Models\User;
use App\Support\CatalogOptions;
use App\Support\ClientProgress;
use App\Support\SafeImage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Completa il tuo profilo": right after the client sign-up (full screen), and
 * "Modifica profilo" in the client area to change the answers later.
 * Saved in `client_preferences` and, for the photo, in `users.avatar_path`.
 */
class CompleteProfileController extends Controller
{
    public function show(Request $request): Response
    {
        return Inertia::render('onboarding/complete-profile', $this->pageData($request));
    }

    /** "Modifica profilo": the same form, inside the client area. */
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

        // Height and weight (GDPR art. 9) only with the consent: without it they are deleted.
        $bodyConsent = $request->boolean('body_data_consent');
        // A query, not the relation: it would stay cached as it was before saving.
        $consentedAt = $user->clientPreference()->first()?->body_data_consent_at;

        $user->clientPreference()->updateOrCreate([], [
            'city_id' => $request->filled('city')
                ? City::query()->where('slug', $request->string('city'))->value('id')
                : null,
            'mode' => $request->input('mode'),
            'goal' => $request->input('goal'),
            'times' => $request->array('times'),
            'discipline_ids' => array_map(fn (string $slug) => $disciplineIds[$slug], $disciplineSlugs),
            'budget_max_cents' => $request->filled('budget_max_cents') ? $request->integer('budget_max_cents') : null,
            'birth_year' => $request->filled('birth_year') ? $request->integer('birth_year') : null,
            'sex' => $request->input('sex'),
            'fitness_level' => $request->input('fitness_level'),
            'training_experience' => $request->input('training_experience'),
            'activity_level' => $request->input('activity_level'),
            'sessions_per_week' => $request->filled('sessions_per_week') ? $request->integer('sessions_per_week') : null,
            'sports' => $request->array('sports'),
            'trainer_note' => $request->input('trainer_note'),
            'height_cm' => $bodyConsent && $request->filled('height_cm') ? $request->integer('height_cm') : null,
            'weight_kg' => $bodyConsent && $request->filled('weight_kg') ? $request->integer('weight_kg') : null,
            // The first time it was given, kept while it is not withdrawn.
            'body_data_consent_at' => $bodyConsent ? ($consentedAt ?? now()) : null,
        ]);

        // The weight over time of "Panoramica" goes with the consent.
        if (! $bodyConsent) {
            $user->bodyMeasurements()->delete();
        } elseif ($request->filled('weight_kg')) {
            // A new weight written here is today's in the trend too.
            $grams = $request->integer('weight_kg') * 1000;
            $last = $user->bodyMeasurements()->latest('measured_on')->value('weight_grams');

            if ($last === null || (int) round($last / 1000) * 1000 !== $grams) {
                $user->bodyMeasurements()->updateOrCreate(
                    ['measured_on' => now(ClientProgress::TIMEZONE)->format('Y-m-d')],
                    ['weight_grams' => $grams],
                );
            }
        }

        // "Modifica profilo" stays on the page; the sign-up goes on to the dashboard.
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

        // Without metadata (GPS position…): see SafeImage.
        $path = SafeImage::store($request->file('photo'), "avatars/{$user->id}", User::AVATAR_DISK);

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
            // "Anno di nascita": from the youngest adult to the oldest year accepted.
            'birthYears' => [
                'from' => ClientPreferencesRequest::youngestBirthYear(),
                'to' => ClientPreferencesRequest::oldestBirthYear(),
            ],
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
            'birthYear' => $preference->birth_year,
            'sex' => $preference->sex?->value,
            'fitnessLevel' => $preference->fitness_level?->value,
            'trainingExperience' => $preference->training_experience?->value,
            'activityLevel' => $preference->activity_level?->value,
            'sessionsPerWeek' => $preference->sessions_per_week,
            'sports' => $preference->sports ?? [],
            'trainerNote' => $preference->trainer_note,
            'bodyDataConsent' => $preference->body_data_consent_at !== null,
            'heightCm' => $preference->height_cm,
            'weightKg' => $preference->weight_kg,
        ];
    }
}
