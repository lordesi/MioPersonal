<?php

namespace App\Http\Controllers;

use App\Enums\GymAmenity;
use App\Enums\GymPlanPeriod;
use App\Models\GroupSession;
use App\Models\GymAmenityDetail;
use App\Models\GymPhoto;
use App\Models\GymPlan;
use App\Models\GymProfile;
use App\Models\GymPromotion;
use App\Models\TrainerPlace;
use App\Models\TrainerProfile;
use App\Support\GroupSessionCard;
use App\Support\GymCard;
use App\Support\GymCourseWeek;
use App\Support\GymDraft;
use App\Support\Seo;
use App\Support\Stats;
use App\Support\TrainerCard;
use App\Support\TrainerSlots;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The public page of a gym: /palestra/{slug}. Photos, where it is and when it
 * is open, services, plans, promotions running today and the trainers who
 * work there (booked from their own profile). Same visibility rules as the
 * trainers (GymProfile::isViewableBy).
 */
class GymProfileController extends Controller
{
    private const DAYS = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

    /** schema.org dayOfWeek, Monday first. */
    private const SCHEMA_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    /** "Palestre simili": shown, and read to choose them. */
    private const SIMILAR = 4;

    private const SIMILAR_CANDIDATES = 30;

    public function __invoke(Request $request, string $slug): Response
    {
        $gym = GymProfile::query()
            ->with(['user', 'city', 'cover', 'galleryPhotos', 'openingHours', 'activePlans', 'activePromotions.plan', 'amenityDetails'])
            ->where('slug', $slug)
            ->firstOrFail();

        abort_unless($gym->isViewableBy($request->user()), 404);

        Stats::recordGymView($request, $gym);

        $gymFavoriteIds = GymCard::favoriteIds($request->user());

        return Inertia::render('public/gym', [
            'gym' => [
                ...$this->profile($gym, TrainerCard::favoriteIds($request->user())),
                'favorite' => in_array($gym->id, $gymFavoriteIds, true),
            ],
            // The owner (or the team) looking at a profile not public yet.
            'preview' => ! $gym->isApproved(),
            'similar' => $gym->isApproved() ? GymCard::many($this->similar($gym), $gymFavoriteIds) : [],
            // "Prossimi eventi" it organizes.
            'events' => GroupSessionCard::many(GroupSessionCard::load(GroupSession::query()->listed()->upcoming()->hostedBy($gym))->orderBy('starts_at')->limit(6)->get()),
            'seo' => $this->seo($gym),
        ]);
    }

    /**
     * "Palestre simili": the published gyms of the same city with the most
     * services in common, then the ones with more trainers.
     *
     * @return list<GymProfile>
     */
    private function similar(GymProfile $gym): array
    {
        $candidates = GymProfile::query()
            ->published()
            ->where('city_id', $gym->city_id)
            ->whereKeyNot($gym->id)
            ->with(GymCard::RELATIONS)
            ->withCount('trainers')
            ->orderByDesc('trainers_count')
            ->orderByDesc('gym_profiles.id')
            ->limit(self::SIMILAR_CANDIDATES)
            ->get();

        $shared = fn (GymProfile $other) => count(array_intersect($other->amenities, $gym->amenities));

        // A stable sort: equal scores keep the order of the query (trainers, newest).
        return array_values($candidates->sortByDesc($shared)->take(self::SIMILAR)->all());
    }

    /**
     * "Servizi": the ticked ones, with the description and photo of "Servizi"
     * in the gym area when there are. Load `amenityDetails`.
     *
     * @return list<array{value: string, label: string, description: string|null, photoUrl: string|null}>
     */
    private static function amenities(GymProfile $gym): array
    {
        $details = $gym->amenityDetails->keyBy(fn (GymAmenityDetail $detail) => $detail->amenity->value);

        return array_values(array_filter(array_map(function (string $value) use ($details) {
            $amenity = GymAmenity::tryFrom($value);

            if ($amenity === null) {
                return null;
            }

            /** @var GymAmenityDetail|null $detail */
            $detail = $details->get($value);

            return [
                'value' => $amenity->value,
                'label' => $amenity->label(),
                'description' => $detail?->description,
                'photoUrl' => $detail?->photoUrl(),
            ];
        }, $gym->amenities)));
    }

    /**
     * @param  list<int>  $trainerFavoriteIds  The heart is full for the trainers the client saved.
     * @return array<string, mixed>
     */
    private function profile(GymProfile $gym, array $trainerFavoriteIds): array
    {
        $now = CarbonImmutable::now(TrainerSlots::TIMEZONE);
        $hours = GymDraft::hours($gym);
        $today = $now->dayOfWeekIso - 1;
        $time = $now->format('H:i');

        return [
            'slug' => $gym->slug,
            'name' => $gym->name,
            'description' => array_values(array_filter(array_map('trim', preg_split('/\R{2,}/', $gym->description) ?: []))),
            'city' => ['name' => $gym->city->name, 'slug' => $gym->city->slug],
            'address' => $gym->fullAddress(),
            'mapsUrl' => $gym->googleMapsUrl(),
            'amenities' => self::amenities($gym),
            'hours' => array_map(fn (array $ranges, int $index) => [
                'day' => self::DAYS[$index],
                'ranges' => array_map(fn (array $range) => "{$range['opens']}–{$range['closes']}", $ranges),
                'today' => $index === $today,
            ], $hours, array_keys($hours)),
            // Computed here, in Rome time: the same on the server render and in the browser.
            'openNow' => $hours === array_fill(0, 7, []) ? null : collect($hours[$today])
                ->contains(fn (array $range) => $range['opens'] <= $time && $time < $range['closes']),
            'openingNotes' => $gym->opening_notes,
            'coverUrl' => $gym->cover?->url(),
            'photos' => $gym->galleryPhotos->map(fn (GymPhoto $photo) => $photo->url())->values()->all(),
            // "Corsi": the plan of this week and the next one, and the courses.
            'courses' => GymCourseWeek::courses($gym),
            'courseWeeks' => [
                GymCourseWeek::days($gym, GymCourseWeek::thisMonday(), viewer: request()->user()),
                GymCourseWeek::days($gym, GymCourseWeek::thisMonday()->addWeek(), viewer: request()->user()),
            ],
            'monthlyFromCents' => $gym->monthly_from_cents,
            'plans' => $gym->activePlans->map(fn (GymPlan $plan) => [
                'id' => $plan->id,
                'name' => $plan->name,
                'period' => $plan->period->label(),
                'priceCents' => $plan->price_cents,
                'suffix' => $plan->suffix(),
                'monthlyCents' => $plan->period === GymPlanPeriod::Monthly ? null : $plan->monthlyCents(),
                'features' => $plan->features ?? [],
                'note' => $plan->note,
            ])->values()->all(),
            'promotions' => $gym->activePromotions->map(fn (GymPromotion $promotion) => [
                'id' => $promotion->id,
                'title' => $promotion->title,
                'description' => $promotion->description,
                'planName' => $promotion->plan?->name,
                'planPriceCents' => $promotion->plan?->price_cents,
                'planSuffix' => $promotion->plan?->suffix(),
                'promoPriceCents' => $promotion->promo_price_cents,
                'discountPercent' => $promotion->discount_percent,
                'endsOn' => $promotion->ends_on?->toDateString(),
            ])->values()->all(),
            'trainers' => $this->trainers($gym, $trainerFavoriteIds),
            'contacts' => [
                'phone' => $gym->phone,
                'email' => $gym->email,
                'website' => $gym->website,
                'instagram' => $gym->instagram,
                'instagramUrl' => $gym->instagram === null ? null : $gym->instagramUrl(),
            ],
        ];
    }

    /**
     * The trainers who work here and are public, each with the place of this
     * gym: their profile opens with it chosen for the booking.
     *
     * @param  list<int>  $favoriteIds
     * @return list<array<string, mixed>>
     */
    private function trainers(GymProfile $gym, array $favoriteIds): array
    {
        $trainers = $gym->trainers()->published()->with(TrainerCard::RELATIONS)->get();
        $places = TrainerPlace::query()
            ->where('gym_profile_id', $gym->id)
            ->whereIn('trainer_profile_id', $trainers->modelKeys())
            ->pluck('id', 'trainer_profile_id');

        return array_values($trainers->map(function (TrainerProfile $trainer) use ($places, $favoriteIds) {
            $card = [...TrainerCard::from($trainer), 'favorite' => in_array($trainer->id, $favoriteIds, true)];
            $place = $places[$trainer->id] ?? null;

            if ($place !== null) {
                $card['href'] .= '?luogo='.$place;
            }

            return $card;
        })->all());
    }

    /**
     * ExerciseGym with address, hours and the plans as offers; indexed only
     * once approved.
     *
     * @return array<string, mixed>
     */
    private function seo(GymProfile $gym): array
    {
        $url = route('gyms.show', $gym->slug);
        $hours = [];

        foreach (GymDraft::hours($gym) as $index => $ranges) {
            foreach ($ranges as $range) {
                $hours[] = [
                    '@type' => 'OpeningHoursSpecification',
                    'dayOfWeek' => self::SCHEMA_DAYS[$index],
                    'opens' => $range['opens'],
                    'closes' => $range['closes'] === '24:00' ? '23:59' : $range['closes'],
                ];
            }
        }

        $prices = $gym->activePlans->pluck('price_cents');

        $business = array_filter([
            '@type' => 'ExerciseGym',
            'name' => $gym->name,
            'url' => $url,
            'description' => Seo::description($gym->description),
            'image' => $gym->cover?->url(),
            'telephone' => $gym->phone,
            'email' => $gym->email,
            'address' => array_filter([
                '@type' => 'PostalAddress',
                'streetAddress' => $gym->address,
                'postalCode' => $gym->postal_code,
                'addressLocality' => $gym->city->name,
                'addressCountry' => 'IT',
            ]),
            'openingHoursSpecification' => $hours ?: null,
            'priceRange' => $prices->isEmpty() ? null : Seo::euros((int) $prices->min()).' – '.Seo::euros((int) $prices->max()),
            'sameAs' => array_values(array_filter([$gym->website, $gym->instagram === null ? null : $gym->instagramUrl()])) ?: null,
            'makesOffer' => $gym->activePlans->map(fn (GymPlan $plan) => [
                '@type' => 'Offer',
                'name' => $plan->name,
                'price' => number_format($plan->price_cents / 100, 2, '.', ''),
                'priceCurrency' => 'EUR',
            ])->values()->all() ?: null,
        ], fn ($value) => $value !== null);

        $amenities = implode(', ', array_slice(array_map(
            fn (string $value) => mb_strtolower(GymAmenity::tryFrom($value)?->label() ?? $value),
            $gym->amenities,
        ), 0, 4));

        return Seo::page(
            title: "{$gym->name} – Palestra a {$gym->city->name}",
            description: "{$gym->name}, palestra a {$gym->city->name}: {$amenities}. Orari, abbonamenti, promozioni e personal trainer su MioPersonal.",
            index: $gym->isApproved(),
            canonical: $url,
            image: $gym->cover?->url(),
            jsonLd: [
                $business,
                Seo::breadcrumbs([
                    'Home' => route('home'),
                    'Palestre' => route('gyms.search'),
                    "Palestre a {$gym->city->name}" => route('gyms.search', $gym->city->slug),
                    $gym->name => $url,
                ]),
            ],
        );
    }
}
