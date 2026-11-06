<?php

namespace App\Support;

use App\Enums\GymAmenity;
use App\Enums\UserRole;
use App\Models\GymProfile;
use App\Models\GymPromotion;
use App\Models\User;

/**
 * A gym in the format of the search cards (GymSummary in
 * resources/js/types/gym.ts).
 */
final class GymCard
{
    /** The relations a card reads: load them (and withCount('trainers')) to avoid one query per card. */
    public const RELATIONS = ['city', 'cover', 'activePromotions'];

    /** Amenities on a card; the profile shows them all. */
    private const AMENITIES_ON_CARD = 4;

    /**
     * @return array<string, mixed>
     */
    public static function from(GymProfile $gym): array
    {
        /** @var GymPromotion|null $promotion */
        $promotion = $gym->activePromotions->first();

        return [
            'slug' => $gym->slug,
            'name' => $gym->name,
            'href' => route('gyms.show', $gym->slug, false),
            'city' => $gym->city->name,
            'address' => $gym->address,
            'coverUrl' => $gym->cover?->url(),
            'amenities' => array_map(
                fn (string $value) => GymAmenity::tryFrom($value)?->label() ?? $value,
                array_slice($gym->amenities, 0, self::AMENITIES_ON_CARD),
            ),
            'amenityCount' => count($gym->amenities),
            'monthlyFromCents' => $gym->monthly_from_cents,
            'promotion' => $promotion?->title,
            'trainerCount' => (int) ($gym->getAttribute('trainers_count') ?? $gym->trainers()->count()),
        ];
    }

    /**
     * The gyms a client saved, for the heart of the cards (empty for guests and the other roles).
     *
     * @return list<int>
     */
    public static function favoriteIds(?User $user): array
    {
        if ($user?->role !== UserRole::Client) {
            return [];
        }

        return array_values(array_map(intval(...), $user->favoriteGyms()->pluck('gym_profiles.id')->all()));
    }

    /**
     * Cards with the heart full for the gyms the client saved.
     *
     * @param  iterable<GymProfile>  $gyms
     * @param  list<int>  $favoriteIds
     * @return list<array<string, mixed>>
     */
    public static function many(iterable $gyms, array $favoriteIds): array
    {
        $cards = [];

        foreach ($gyms as $gym) {
            $cards[] = [...self::from($gym), 'favorite' => in_array($gym->id, $favoriteIds, true)];
        }

        return $cards;
    }
}
