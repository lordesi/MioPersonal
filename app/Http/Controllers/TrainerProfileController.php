<?php

namespace App\Http\Controllers;

use App\Enums\PlaceType;
use App\Models\Service;
use App\Models\TrainerDocument;
use App\Models\TrainerPhoto;
use App\Models\TrainerPlace;
use App\Models\TrainerProfile;
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

    public function __invoke(Request $request, string $slug): Response
    {
        $profile = TrainerProfile::where('slug', $slug)
            ->with(['user', 'city', 'otherCities', 'disciplines', 'places.city', 'services', 'photos', 'documents', 'workingHours'])
            ->first();

        abort_if($profile === null || ! $profile->isViewableBy($request->user()), 404);

        return Inertia::render('public/profile', [
            'trainer' => [
                ...$this->profile($profile),
                // "Salva": full heart when the client already saved this trainer.
                'favorite' => in_array($profile->id, TrainerCard::favoriteIds($request->user()), true),
            ],
            // Not approved yet: the trainer (or the team) is looking at a preview.
            'preview' => ! $profile->isApproved(),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function profile(TrainerProfile $profile): array
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
            'rating' => $profile->rating(),
            'reviewCount' => $profile->rating_count,
            'city' => $profile->city === null ? null : ['slug' => $profile->city->slug, 'name' => $profile->city->name],
            'cities' => $cities ?: ['Solo online'],
            'areaLabel' => $profile->city->name ?? 'Online',
            'online' => TrainerCard::online($profile),
            'disciplines' => $profile->disciplines->pluck('name')->all(),
            'photos' => $this->photos($profile),
            'services' => $profile->services->where('is_active', true)->map(fn (Service $service) => [
                'id' => $service->id,
                'name' => $service->name,
                'minutes' => $service->minutes,
                'durationLabel' => $this->durationLabel($service, $profile->session_minutes),
                'note' => $service->note ?? '',
                'priceCents' => $service->price_cents,
                'perHour' => $service->price_per_hour,
                'fixedDuration' => $service->fixed_duration,
            ])->values()->all(),
            'places' => $profile->places->map(fn (TrainerPlace $place) => $this->place($place, $cities))->all(),
            'certifications' => $profile->documents->where('type', 'certificate')->map(fn (TrainerDocument $document) => [
                'title' => $document->title,
                'issuer' => $document->issuerLabel(),
            ])->values()->all(),
            // TODO (step 6): the real reviews and their distribution.
            'ratingDistribution' => [],
            'reviews' => [],
            // "Durate prenotabili", in minutes, shortest first.
            'sessionMinutes' => $profile->session_minutes,
            'availability' => TrainerSlots::days($profile, self::AVAILABILITY_DAYS),
            'similarTrainers' => $this->similar($profile),
        ];
    }

    /**
     * The saved photos; without any, a placeholder with the initials.
     *
     * @return list<array{caption: string, isPortrait: bool, url: string|null}>
     */
    private function photos(TrainerProfile $profile): array
    {
        $photos = array_values($profile->photos
            ->sortByDesc('is_portrait')
            ->map(fn (TrainerPhoto $photo) => [
                'caption' => $photo->caption ?? '',
                'isPortrait' => $photo->is_portrait,
                'url' => $photo->url(),
            ])->all());

        return $photos ?: [['caption' => 'Ritratto', 'isPortrait' => true, 'url' => null]];
    }

    /**
     * "1 ora", "1 ora e mezza", "45 min", "10 × 1 ora"; an hourly service that
     * follows the trainer's durations: "da 30 min a 2 ore".
     *
     * @param  list<int>  $sessionMinutes
     */
    private function durationLabel(Service $service, array $sessionMinutes): string
    {
        $one = self::minutesLabel($service->minutes);

        if ($service->package_sessions !== null) {
            return "{$service->package_sessions} × {$one}";
        }

        if ($service->price_per_hour && ! $service->fixed_duration && $sessionMinutes !== []) {
            $shortest = min($sessionMinutes);
            $longest = max($sessionMinutes);

            return $shortest === $longest
                ? self::minutesLabel($shortest)
                : 'da '.self::minutesLabel($shortest).' a '.self::minutesLabel($longest);
        }

        return $one;
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
     * Other published trainers of the same city with a discipline in common.
     *
     * @return list<array{name: string, href: string, subtitle: string, detail: string}>
     */
    private function similar(TrainerProfile $profile): array
    {
        if ($profile->city_id === null) {
            return [];
        }

        $others = TrainerProfile::query()
            ->published()
            ->whereKeyNot($profile->id)
            ->where('city_id', $profile->city_id)
            ->whereHas('disciplines', fn ($query) => $query->whereKey($profile->disciplines->modelKeys()))
            ->with(TrainerCard::RELATIONS)
            ->orderByDesc('rating_count')
            ->limit(self::SIMILAR)
            ->get();

        return array_values($others->map(function (TrainerProfile $other) {
            $slot = TrainerCard::slotLabel($other->next_free_slot_at);
            $cents = $other->price_from_cents ?? 0;
            // "da 45 €", or "da 45,50 €" with cents.
            $price = 'da '.number_format($cents / 100, $cents % 100 === 0 ? 0 : 2, ',', '.').' €';

            return [
                'name' => $other->user->name,
                'href' => route('trainers.show', $other->slug, false),
                'subtitle' => TrainerCard::cityLabel($other).' · '.$other->disciplines->pluck('name')->take(2)->implode(', '),
                'detail' => $slot === null ? $price : "{$price} · primo slot {$slot}",
            ];
        })->all());
    }
}
