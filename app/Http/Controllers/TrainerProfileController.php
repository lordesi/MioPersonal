<?php

namespace App\Http\Controllers;

use App\Enums\PlaceType;
use App\Models\ClientPackage;
use App\Models\Review;
use App\Models\Service;
use App\Models\TrainerDocument;
use App\Models\TrainerPhoto;
use App\Models\TrainerPlace;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Support\SimilarTrainers;
use App\Support\TrainerCard;
use App\Support\TrainerSlots;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The public profile /trainer/{slug}. Before the team approves it, only its
 * trainer (preview) and the team can open it; for everybody else it is a 404.
 */
class TrainerProfileController extends Controller
{
    /** Days of free slots shown in the calendar. */
    private const AVAILABILITY_DAYS = 21;

    private const SIMILAR = 3;

    /** Reviews shown before "Mostra tutte le recensioni". */
    private const REVIEWS_PREVIEW = 3;

    public function __invoke(Request $request, string $slug): Response
    {
        $profile = TrainerProfile::where('slug', $slug)
            ->with(['user', 'city', 'otherCities', 'disciplines', 'places.city', 'services', 'photos', 'documents', 'workingHours'])
            ->first();

        abort_if($profile === null || ! $profile->isViewableBy($request->user()), 404);

        return Inertia::render('public/profile', [
            'trainer' => [
                ...$this->profile($profile, $request->user()),
                // "Salva": full heart when the client already saved this trainer.
                'favorite' => in_array($profile->id, TrainerCard::favoriteIds($request->user()), true),
            ],
            // Not approved yet: the trainer (or the team) is looking at a preview.
            'preview' => ! $profile->isApproved(),
            // "Mostra tutte le recensioni": sent only when the page asks for it
            // (router.reload with only: ['allReviews']), never on the first load.
            'allReviews' => Inertia::optional(fn () => $this->reviews($profile)),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function profile(TrainerProfile $profile, ?User $viewer): array
    {
        $cities = array_values(array_filter([$profile->city?->name, ...$profile->otherCities->pluck('name')->all()]));

        return [
            'slug' => $profile->slug,
            'name' => $profile->user->name,
            'headline' => $profile->headline,
            // Checked by the team: approved profiles only.
            'verified' => $profile->isApproved(),
            // Paragraphs split at the empty lines.
            'bio' => array_values(array_filter(array_map(trim(...), preg_split('/\R\s*\R/', $profile->bio) ?: []))),
            'experienceLabel' => $profile->experience->profileLabel(),
            // TODO (step 5): computed from the answers to the bookings.
            'responseTimeLabel' => null,
            'cancellationLabel' => "Cancellazione gratuita fino a {$profile->free_cancellation_hours} ore prima",
            // Under the booking button: how soon the client gets an answer.
            'confirmLabel' => $profile->auto_confirm ? 'Conferma immediata' : "Conferma entro {$profile->confirm_hours} ore",
            'rating' => $profile->rating(),
            'reviewCount' => $profile->rating_count,
            'city' => $profile->city === null ? null : ['slug' => $profile->city->slug, 'name' => $profile->city->name],
            'cities' => $cities ?: ['Solo online'],
            'online' => TrainerCard::online($profile),
            'disciplines' => $profile->disciplines->pluck('name')->all(),
            // App\Enums\TrainingGoal values: the page shows them with the labels of goals.ts.
            'goals' => $profile->goals ?? [],
            // The profile photo goes in the circle next to the name, not in the carousel.
            'portraitUrl' => $profile->photos->firstWhere('is_portrait', true)?->url(),
            'photos' => $this->photos($profile),
            'services' => $this->services($profile, $viewer),
            'places' => $profile->places->map(fn (TrainerPlace $place) => $this->place($place, $cities))->all(),
            'certifications' => $profile->documents->where('type', 'certificate')->map(fn (TrainerDocument $document) => [
                'title' => $document->title,
                'issuer' => $document->issuerLabel(),
            ])->values()->all(),
            'ratingDistribution' => $this->ratingDistribution($profile),
            // The preview: the latest ones. All of them are in `allReviews`.
            'reviews' => $this->reviews($profile, self::REVIEWS_PREVIEW),
            'availability' => TrainerSlots::days($profile, self::AVAILABILITY_DAYS),
            'similarTrainers' => $this->similar($profile),
        ];
    }

    /**
     * How many reviews have 5 stars, 4, … 1 (the bars of the summary).
     * Always 5 rows, with 0 for the missing ones; hidden reviews don't count.
     *
     * @return list<array{stars: int, count: int}>
     */
    private function ratingDistribution(TrainerProfile $profile): array
    {
        $counts = $profile->reviews()
            ->notHidden()
            ->selectRaw('rating, count(*) as total')
            ->groupBy('rating')
            ->pluck('total', 'rating');

        return array_map(fn (int $stars) => [
            'stars' => $stars,
            'count' => (int) ($counts[$stars] ?? 0),
        ], [5, 4, 3, 2, 1]);
    }

    /**
     * The reviews that are not hidden, newest first; all of them without a limit.
     *
     * @return list<array{id: int, authorName: string, rating: int, text: string, reply: string|null, serviceName: string|null, createdAt: string|null}>
     */
    private function reviews(TrainerProfile $profile, ?int $limit = null): array
    {
        return array_values($profile->reviews()
            ->notHidden()
            ->with(['client', 'booking'])
            ->latest()
            ->latest('id')
            ->when($limit !== null, fn ($query) => $query->limit($limit))
            ->get()
            ->map(fn (Review $review) => [
                'id' => $review->id,
                // The client deleted the account: the review stays, anonymous.
                'authorName' => $review->client?->publicName() ?? 'Utente anonimo',
                'rating' => $review->rating,
                'text' => $review->text,
                'reply' => $review->reply,
                // The booked service, e.g. "Seduta singola"; none for the demo reviews.
                'serviceName' => $review->booking?->service_name,
                // ISO UTC: the page shows "3 giorni fa" and sorts by date.
                'createdAt' => $review->created_at?->toIso8601ZuluString(),
            ])->all());
    }

    /**
     * The photos of the carousel: the gallery, without the profile photo.
     * Without any, the page shows no carousel.
     *
     * @return list<array{caption: string, url: string}>
     */
    private function photos(TrainerProfile $profile): array
    {
        return array_values($profile->photos
            ->reject(fn (TrainerPhoto $photo) => $photo->is_portrait)
            ->map(fn (TrainerPhoto $photo) => [
                'caption' => $photo->caption ?? '',
                'url' => $photo->url(),
            ])->all());
    }

    /**
     * The services as the client chooses them. The rows of a kind of session
     * (one per duration, fixed_duration = false, same name) become one
     * service, and so do its online rows: `options` has a price for each
     * duration. The first session and the packages have a single option.
     * The first session is only for a client's first booking: who already
     * booked this trainer doesn't see it.
     *
     * A client with a package of this trainer finds it first, "Il tuo
     * pacchetto": its sessions are already paid.
     *
     * @return list<array{id: int, packageId: int|null, name: string, durationLabel: string, note: string, priceCents: int, options: list<array{serviceId: int, minutes: int, priceCents: int}>}>
     */
    private function services(TrainerProfile $profile, ?User $viewer): array
    {
        return [...$this->packages($profile, $viewer), ...$this->bookableServices($profile, $viewer)];
    }

    /**
     * The viewer's bought packages with sessions still to book. The id is
     * negative, so it never matches the id of a service.
     *
     * @return list<array{id: int, packageId: int, name: string, durationLabel: string, note: string, priceCents: int, options: list<array{serviceId: int, minutes: int, priceCents: int}>}>
     */
    private function packages(TrainerProfile $profile, ?User $viewer): array
    {
        if ($viewer === null) {
            return [];
        }

        return array_values($profile->clientPackages()
            ->whereBelongsTo($viewer, 'client')
            ->bought()
            ->withSessionCounts()
            ->oldest('bought_at')
            ->get()
            ->filter(fn (ClientPackage $package) => $package->remaining() > 0)
            ->map(function (ClientPackage $package) {
                $remaining = $package->remaining();

                return [
                    'id' => -$package->id,
                    'packageId' => $package->id,
                    'name' => 'Il tuo pacchetto',
                    'durationLabel' => ($remaining === 1 ? '1 seduta rimasta' : "{$remaining} sedute rimaste").' · '.self::minutesLabel($package->minutes),
                    'note' => $package->name,
                    'priceCents' => 0,
                    'options' => [['serviceId' => -$package->id, 'minutes' => $package->minutes, 'priceCents' => 0]],
                ];
            })->all());
    }

    /**
     * @return list<array{id: int, packageId: null, name: string, durationLabel: string, note: string, priceCents: int, options: list<array{serviceId: int, minutes: int, priceCents: int}>}>
     */
    private function bookableServices(TrainerProfile $profile, ?User $viewer): array
    {
        $groups = [];
        $booked = $viewer !== null && $profile->hasBookingFrom($viewer);

        foreach ($profile->services->where('is_active', true)->sortBy('sort') as $service) {
            if ($booked && $service->isFirstSession()) {
                continue;
            }

            $key = $service->fixed_duration
                ? "service-{$service->id}"
                : ($service->online_only ? 'online:' : 'kind:').$service->name;
            $groups[$key][] = $service;
        }

        return array_values(array_map(function (array $rows) {
            // Shortest first: the first row gives name and note, the last the longest duration.
            usort($rows, fn (Service $a, Service $b) => $a->minutes <=> $b->minutes);
            $first = $rows[0];
            $longest = $rows[array_key_last($rows)]->minutes;
            $options = array_map(fn (Service $service) => [
                'serviceId' => $service->id,
                'minutes' => $service->minutes,
                'priceCents' => $service->price_cents,
            ], $rows);

            return [
                'id' => $first->id,
                'packageId' => null,
                'name' => $first->displayName(),
                'durationLabel' => $this->durationLabel($first, $longest),
                'note' => $first->note ?? '',
                // The lowest price: "da 25 €" when the price depends on the duration.
                'priceCents' => min($first->price_cents, ...array_column($options, 'priceCents')),
                'options' => $options,
            ];
        }, $groups));
    }

    /**
     * "1 ora", "1 ora e mezza", "45 min", "10 × 1 ora"; a service with more
     * durations (from the shortest, $service, to $longest): "da 30 min a 2 ore".
     */
    private function durationLabel(Service $service, int $longest): string
    {
        $one = self::minutesLabel($service->minutes);

        if ($service->package_sessions !== null) {
            return "{$service->package_sessions} × {$one}";
        }

        $shortest = $service->minutes;

        return $shortest === $longest
            ? self::minutesLabel($shortest)
            : 'da '.self::minutesLabel($shortest).' a '.self::minutesLabel($longest);
    }

    /** 30 → "30 min", 60 → "1 ora", 90 → "1 ora e mezza", 120 → "2 ore". Same as formatDuration() in format.ts. */
    private static function minutesLabel(int $minutes): string
    {
        $hours = intdiv($minutes, 60);
        $rest = $minutes % 60;

        if ($hours === 0) {
            return "{$minutes} min";
        }

        $label = $hours === 1 ? '1 ora' : "{$hours} ore";

        return match ($rest) {
            0 => $label,
            30 => "{$label} e mezza",
            default => "{$label} e {$rest} min",
        };
    }

    /**
     * @param  list<string>  $cities
     * @return array{type: string, title: string, detail: string}
     */
    private function place(TrainerPlace $place, array $cities): array
    {
        return [
            'type' => $place->type->value,
            'title' => $place->type === PlaceType::Studio ? ($place->name ?? 'Studio') : $place->type->label(),
            'detail' => match ($place->type) {
                PlaceType::Studio => implode(', ', array_filter([$place->city?->name, $place->address])),
                PlaceType::Online => 'In videochiamata',
                default => implode(', ', $cities),
            },
        ];
    }

    /**
     * The published trainers closest in disciplines, goals and place (see
     * SimilarTrainers), in the format of the search cards (TrainerCard).
     *
     * @return list<array<string, mixed>>
     */
    private function similar(TrainerProfile $profile): array
    {
        $ids = SimilarTrainers::ids($profile, self::SIMILAR);

        // Loaded with everything the cards need, back in the order of $ids.
        return array_values(TrainerProfile::query()
            ->with(TrainerCard::RELATIONS)
            ->findMany($ids)
            ->sortBy(fn (TrainerProfile $other) => array_search($other->id, $ids, true))
            ->map(TrainerCard::from(...))
            ->all());
    }
}
