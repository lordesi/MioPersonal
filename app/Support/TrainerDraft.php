<?php

namespace App\Support;

use App\Enums\PlaceType;
use App\Models\Service;
use App\Models\TrainerProfile;
use Illuminate\Support\Collection;

/**
 * A saved profile in the format of the trainer form (TrainerDraft in
 * resources/js/components/onboarding/trainer/draft.ts), read by "Diventa
 * trainer" (fixing the profile) and by "Modifica profilo".
 */
final class TrainerDraft
{
    /**
     * @return array<string, mixed>
     */
    public static function fromProfile(TrainerProfile $profile): array
    {
        $profile->load(['city', 'otherCities', 'disciplines', 'places', 'services', 'workingHours', 'documents', 'portrait']);

        return [
            'headline' => $profile->headline,
            'bio' => $profile->bio,
            'experience' => $profile->experience->value,
            'photoUrl' => $profile->portrait?->url(),
            'disciplines' => $profile->disciplines->pluck('slug')->all(),
            'goals' => $profile->goals ?? [],
            'places' => $profile->places->pluck('type')->unique()->map(fn (PlaceType $type) => $type->value)->values()->all(),
            'studios' => $profile->places
                ->where('type', PlaceType::Studio)
                ->map(fn ($place) => ['name' => $place->name ?? '', 'address' => $place->address ?? ''])
                ->values()->all() ?: [['name' => '', 'address' => '']],
            'city' => $profile->city->slug ?? '',
            'otherCities' => $profile->otherCities->pluck('slug')->all(),
            'pricing' => self::pricing($profile),
            // Step 5: hours, rules and auto-confirm.
            ...TrainerAvailability::fromProfile($profile),
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
     * read back from the rows written by SaveTrainerServices.
     *
     * @return array<string, mixed>
     */
    public static function pricing(TrainerProfile $profile): array
    {
        $services = $profile->services->sortBy('sort');
        // The kinds of session and their online prices: one row for each duration
        // (fixed_duration = false), the rows of a kind share its name.
        $kinds = $services->filter(fn (Service $service) => $service->kind === 'session' && ! $service->fixed_duration);
        $inPerson = $kinds->reject(fn (Service $service) => $service->online_only)->groupBy('name');
        $online = $kinds->filter(fn (Service $service) => $service->online_only)->groupBy('name');
        $first = $services->first(fn (Service $service) => $service->isFirstSession());
        // Older profiles have one "Seduta online" for every kind: it goes to the first kind.
        $orphanOnline = $online->keys()->diff($inPerson->keys())->first();

        $sessions = $inPerson->values()->map(function (Collection $rows, int $index) use ($online, $orphanOnline) {
            // groupBy() never makes an empty group.
            $first = $rows->firstOrFail();
            $onlineRows = $online->get($first->name) ?? ($index === 0 && $orphanOnline !== null ? $online->get($orphanOnline) : null) ?? collect();

            return [
                'name' => $first->name,
                'prices' => self::prices($rows),
                'note' => $first->note ?? '',
                'online' => self::prices($onlineRows),
                'onlineNote' => $onlineRows->first()->note ?? '',
            ];
        })->all();

        return [
            'sessions' => $sessions ?: [['name' => 'Seduta singola', 'prices' => [], 'note' => '', 'online' => [], 'onlineNote' => '']],
            'onlineSamePrice' => $online->isEmpty(),
            'firstSession' => [
                'enabled' => $first !== null,
                'minutes' => self::minutes($first->minutes ?? 60),
                'priceCents' => $first?->price_cents,
                'note' => $first->note ?? '',
            ],
            'packages' => $services->where('kind', 'package')->map(fn (Service $service) => [
                'sessions' => $service->package_sessions ?? 10,
                'minutes' => self::minutes($service->minutes),
                'priceCents' => $service->price_cents,
                'note' => $service->note ?? '',
            ])->values()->all(),
        ];
    }

    /**
     * The prices of a kind of session by duration, shortest first.
     *
     * @param  Collection<array-key, Service>  $rows
     * @return list<array{minutes: int, priceCents: int}>
     */
    private static function prices(Collection $rows): array
    {
        return array_values($rows
            ->map(fn (Service $service) => ['minutes' => self::minutes($service->minutes), 'priceCents' => $service->price_cents])
            ->unique('minutes')->sortBy('minutes')->all());
    }

    /** Older profiles may have durations that can't be chosen any more (e.g. 45 min). */
    private static function minutes(int $value): int
    {
        return in_array($value, TrainerProfile::SESSION_MINUTES, true) ? $value : 60;
    }
}
