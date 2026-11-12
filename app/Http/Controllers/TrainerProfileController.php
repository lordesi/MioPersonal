<?php

namespace App\Http\Controllers;

use App\Actions\Trainer\LinkClient;
use App\Enums\PlaceType;
use App\Models\ClientPackage;
use App\Models\GroupSession;
use App\Models\Review;
use App\Models\Service;
use App\Models\TrainerDocument;
use App\Models\TrainerPhoto;
use App\Models\TrainerPlace;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Models\WaitlistEntry;
use App\Support\GroupSessionCard;
use App\Support\Seo;
use App\Support\SimilarTrainers;
use App\Support\Stats;
use App\Support\TrainerCard;
use App\Support\TrainerSlots;
use App\Support\TrainerSocials;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
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
        // "Trainer simili" show their first free slot.
        TrainerSlots::refreshStale();

        $profile = TrainerProfile::where('slug', $slug)
            ->with(['user', 'city', 'otherCities', 'disciplines', 'places.city', 'places.gymProfile.city', 'places.gymProfile.user', 'places.gymProfile.cover', 'services', 'photos', 'documents', 'workingHours', 'socialAccounts'])
            ->first();

        abort_if($profile === null || ! $profile->isViewableBy($request->user()), 404);

        $this->rememberPersonalLink($request, $profile);

        // "Visite al profilo", for the team and later for the trainer.
        Stats::recordProfileView($request, $profile);

        return Inertia::render('public/profile', [
            'trainer' => [
                ...$this->profile($profile, $request->user()),
                // "Salva": full heart when the client already saved this trainer.
                'favorite' => in_array($profile->id, TrainerCard::favoriteIds($request->user()), true),
            ],
            // Not approved yet: the trainer (or the team) is looking at a preview.
            'preview' => ! $profile->isApproved(),
            // The link of "Invita i tuoi clienti" (TrainerClientsController::invite).
            'invited' => $request->boolean('invito'),
            // "Mostra tutte le recensioni": sent only when the page asks for it
            // (router.reload with only: ['allReviews']), never on the first load.
            'allReviews' => Inertia::optional(fn () => $this->reviews($profile)),
            // "Prossimi eventi" the trainer organizes.
            'events' => GroupSessionCard::many(GroupSessionCard::load(GroupSession::query()->listed()->upcoming()->hostedBy($profile))->orderBy('starts_at')->limit(6)->get()),
            'seo' => $this->seo($profile),
        ]);
    }

    /**
     * The personal link a trainer sent to a client they added ("?c=…"): kept in the
     * session until the client signs up and books; a logged-in client is linked at once.
     */
    private function rememberPersonalLink(Request $request, TrainerProfile $profile): void
    {
        $token = $request->query('c');

        if (! is_string($token) || strlen($token) > 40) {
            return;
        }

        $request->session()->put(LinkClient::SESSION_KEY.'.'.$profile->id, $token);

        if ($request->user() !== null && $request->user()->id !== $profile->user_id) {
            app(LinkClient::class)->claimToken($profile, $request->user(), $token);
        }
    }

    /**
     * "Marco Bianchi, personal trainer a Roma", with the JSON-LD that gives
     * Google the stars of the reviews. Only the profiles of the search are
     * indexed: a preview, or a profile paused or hidden by its trainer, is not.
     *
     * @return array<string, mixed>
     */
    private function seo(TrainerProfile $profile): array
    {
        $name = $profile->user->name;
        $url = route('trainers.show', $profile->slug);
        $place = $profile->city === null ? 'online' : "a {$profile->city->name}";
        $disciplines = $profile->disciplines->pluck('name')->all();
        $rating = $profile->rating();
        $portrait = $profile->photos->firstWhere('is_portrait', true)?->url();

        $facts = array_filter([
            $disciplines === [] ? null : implode(', ', $disciplines),
            $rating === null ? null : str_replace('.', ',', (string) $rating).'/5 su '.$profile->rating_count.($profile->rating_count === 1 ? ' recensione' : ' recensioni'),
            $profile->price_from_cents ? 'da '.Seo::euros($profile->price_from_cents).' a seduta' : null,
        ]);
        // The facts first: Google cuts the end, the headline goes there.
        $description = "{$name}, personal trainer {$place}. "
            .($facts === [] ? '' : implode(' · ', $facts).'. ')
            .($profile->headline ? rtrim($profile->headline, '.').'. ' : '')
            .'Prenota su MioPersonal.';

        // A single session: the packages would stretch the range ("50 € - 450 €").
        $prices = $profile->services->where('is_active', true)->where('kind', 'session')->pluck('price_cents')->filter();
        $cities = array_values(array_filter([$profile->city?->name, ...$profile->otherCities->pluck('name')->all()]));

        $socials = array_column(TrainerSocials::publicLinks($profile), 'url') ?: null;

        // The person behind the service: who an assistant names when asked for a trainer.
        $person = array_filter([
            '@type' => 'Person',
            '@id' => $url.'#person',
            'name' => $name,
            'jobTitle' => 'Personal trainer',
            'url' => $url,
            'image' => $portrait,
            'description' => $profile->bio ? Seo::description($profile->bio) : null,
            'knowsAbout' => $disciplines === [] ? null : $disciplines,
            'workLocation' => $profile->city === null ? null : ['@type' => 'City', 'name' => $profile->city->name],
            'sameAs' => $socials,
        ]);

        // The services with their price, as on the page ("Seduta singola · 60 min · 45 €").
        $offers = $profile->services->where('is_active', true)->filter(fn ($service) => $service->price_cents > 0)->values();

        // The last real reviews, as on the page: not the hidden ones, not the demo ones.
        $reviews = $profile->reviews()->notHidden()->whereNotNull('booking_id')->with('client')
            ->latest()->latest('id')->limit(self::REVIEWS_PREVIEW + 2)->get();

        $business = array_filter([
            '@type' => 'ProfessionalService',
            '@id' => $url.'#trainer',
            'name' => "{$name} - Personal trainer",
            'url' => $url,
            'description' => $profile->headline,
            'image' => $portrait,
            'founder' => ['@id' => $url.'#person'],
            'address' => $profile->city === null ? null : ['@type' => 'PostalAddress', 'addressLocality' => $profile->city->name, 'addressCountry' => 'IT'],
            'hasOfferCatalog' => $offers->isEmpty() ? null : [
                '@type' => 'OfferCatalog',
                'name' => 'Servizi',
                'itemListElement' => $offers->map(fn ($service) => [
                    '@type' => 'Offer',
                    'itemOffered' => ['@type' => 'Service', 'name' => $service->displayName()],
                    'price' => number_format($service->price_cents / 100, 2, '.', ''),
                    'priceCurrency' => 'EUR',
                ])->all(),
            ],
            'review' => $reviews->isEmpty() ? null : $reviews->map(fn (Review $review) => [
                '@type' => 'Review',
                'author' => ['@type' => 'Person', 'name' => $review->client?->publicName() ?? 'Utente anonimo'],
                'datePublished' => $review->created_at?->toDateString(),
                'reviewBody' => $review->text,
                'reviewRating' => ['@type' => 'Rating', 'ratingValue' => $review->rating, 'bestRating' => 5, 'worstRating' => 1],
            ])->all(),
            'priceRange' => $prices->isEmpty() ? null : Seo::euros((int) $prices->min()).($prices->min() === $prices->max() ? '' : ' - '.Seo::euros((int) $prices->max())),
            'areaServed' => $cities === [] ? null : array_map(fn (string $city) => ['@type' => 'City', 'name' => $city], $cities),
            'knowsAbout' => $disciplines === [] ? null : $disciplines,
            'sameAs' => $socials,
            // Only real reviews: no rating at all for a new profile.
            'aggregateRating' => $rating === null ? null : [
                '@type' => 'AggregateRating',
                'ratingValue' => $rating,
                'reviewCount' => $profile->rating_count,
                'bestRating' => 5,
                'worstRating' => 1,
            ],
        ]);

        $crumbs = ['Home' => route('home'), 'Personal trainer' => route('trainers.search')];
        if ($profile->city !== null) {
            $crumbs["Personal trainer a {$profile->city->name}"] = route('trainers.search', $profile->city->slug);
        }
        $crumbs[$name] = $url;

        return Seo::page(
            title: "{$name}, personal trainer {$place}",
            description: $description,
            index: TrainerProfile::query()->published()->whereKey($profile->id)->exists(),
            canonical: $url,
            image: $portrait,
            type: 'profile',
            jsonLd: [$business, Seo::breadcrumbs($crumbs), $person],
        );
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
            // Public on purpose: the socials the trainer linked (and an Instagram typed by hand).
            'socials' => TrainerSocials::publicLinks($profile),
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
            'places' => self::visiblePlaces($profile)->map(fn (TrainerPlace $place) => $this->place($place, $cities))->all(),
            'gyms' => $this->gyms($profile),
            'certifications' => $profile->documents->where('type', 'certificate')->map(fn (TrainerDocument $document) => [
                'title' => $document->title,
                'issuer' => $document->issuerLabel(),
            ])->values()->all(),
            'ratingDistribution' => $this->ratingDistribution($profile),
            // The preview: the latest ones. All of them are in `allReviews`.
            'reviews' => $this->reviews($profile, self::REVIEWS_PREVIEW),
            'availability' => TrainerSlots::days($profile, self::AVAILABILITY_DAYS),
            // "Avvisami se si libera": the full days the viewer is waiting for.
            'waitlistDays' => $viewer === null ? [] : WaitlistEntry::query()
                ->where('user_id', $viewer->id)->where('trainer_profile_id', $profile->id)
                ->where('day', '>=', CarbonImmutable::now(TrainerSlots::TIMEZONE)->toDateString())
                ->orderBy('day')->get()
                ->map(fn (WaitlistEntry $entry) => $entry->day->toDateString())->all(),
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
     * @return list<array{id: int, packageId: int|null, name: string, durationLabel: string, note: string, priceCents: int, options: list<array{serviceId: int, minutes: int, priceCents: int, groupPrices: list<array{people: int, priceCents: int}>}>}>
     */
    private function services(TrainerProfile $profile, ?User $viewer): array
    {
        return [...$this->packages($profile, $viewer), ...$this->bookableServices($profile, $viewer)];
    }

    /**
     * The viewer's bought packages with sessions still to book. The id is
     * negative, so it never matches the id of a service.
     *
     * @return list<array{id: int, packageId: int, name: string, durationLabel: string, note: string, priceCents: int, options: list<array{serviceId: int, minutes: int, priceCents: int, groupPrices: list<array{people: int, priceCents: int}>}>}>
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
                    'options' => [['serviceId' => -$package->id, 'minutes' => $package->minutes, 'priceCents' => 0, 'groupPrices' => []]],
                ];
            })->all());
    }

    /**
     * @return list<array{id: int, packageId: null, name: string, durationLabel: string, note: string, priceCents: int, options: list<array{serviceId: int, minutes: int, priceCents: int, groupPrices: list<array{people: int, priceCents: int}>}>}>
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
                // "Invita un amico": the total for 2… people; empty = only the booker.
                'groupPrices' => self::groupPrices($service),
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
     * "Invita un amico": the total of a duration for 2… people.
     *
     * @return list<array{people: int, priceCents: int}>
     */
    private static function groupPrices(Service $service): array
    {
        $prices = [];

        foreach ($service->pricesByPeople() as $people => $cents) {
            if ($people > 1) {
                $prices[] = ['people' => $people, 'priceCents' => $cents];
            }
        }

        return $prices;
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
     * @return array{id: int, type: string, title: string, detail: string, href: string|null}
     */
    private function place(TrainerPlace $place, array $cities): array
    {
        $gym = $place->gymProfile;

        return [
            // "Dove" of the booking (BookingController: luogo).
            'id' => $place->id,
            'type' => $place->type->value,
            'title' => match ($place->type) {
                PlaceType::Studio => $place->name ?? 'Studio',
                PlaceType::Gym => $gym->name ?? 'Palestra',
                default => $place->type->label(),
            },
            'detail' => match ($place->type) {
                PlaceType::Studio => implode(', ', array_filter([$place->city?->name, $place->address])),
                PlaceType::Gym => $gym === null ? '' : $gym->fullAddress(),
                PlaceType::Online => 'In videochiamata',
                default => implode(', ', $cities),
            },
            'href' => $gym === null ? null : route('gyms.show', $gym->slug, false),
        ];
    }

    /**
     * The places shown: a gym only while it is public (approved, owner active).
     *
     * @return Collection<int, TrainerPlace>
     */
    public static function visiblePlaces(TrainerProfile $profile): Collection
    {
        return $profile->places
            ->filter(fn (TrainerPlace $place) => $place->type !== PlaceType::Gym
                || ($place->gymProfile?->isApproved() && $place->gymProfile->ownerIsActive()))
            ->values();
    }

    /**
     * "Palestre dove allena".
     *
     * @return list<array<string, mixed>>
     */
    private function gyms(TrainerProfile $profile): array
    {
        return array_values(self::visiblePlaces($profile)
            ->filter(fn (TrainerPlace $place) => $place->type === PlaceType::Gym && $place->gymProfile !== null)
            ->map(fn (TrainerPlace $place) => [
                'slug' => $place->gymProfile->slug,
                'name' => $place->gymProfile->name,
                'city' => $place->gymProfile->city->name,
                'address' => $place->gymProfile->fullAddress(),
                'coverUrl' => $place->gymProfile->cover?->url(),
                'href' => route('gyms.show', $place->gymProfile->slug, false),
            ])->all());
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
