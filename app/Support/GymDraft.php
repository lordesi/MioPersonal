<?php

namespace App\Support;

use App\Models\GymOpeningHour;
use App\Models\GymPhoto;
use App\Models\GymProfile;

/**
 * A saved gym profile in the shape of the form (GymDraft in
 * resources/js/components/onboarding/gym/draft.ts): to fix it after
 * "Chiedi modifiche" and for "Modifica profilo".
 */
class GymDraft
{
    /**
     * @return array<string, mixed>
     */
    public static function fromProfile(GymProfile $profile): array
    {
        $profile->loadMissing(['city', 'cover', 'galleryPhotos', 'openingHours']);

        return [
            'name' => $profile->name,
            'city' => $profile->city->slug,
            'address' => $profile->address,
            'postalCode' => $profile->postal_code ?? '',
            'description' => $profile->description,
            'amenities' => $profile->amenities,
            'hours' => self::hours($profile),
            'openingNotes' => $profile->opening_notes ?? '',
            'coverUrl' => $profile->cover?->url(),
            'galleryUrls' => $profile->galleryPhotos->map(fn (GymPhoto $photo) => $photo->url())->values()->all(),
            'contactPhone' => $profile->phone ?? '',
            'contactEmail' => $profile->email ?? '',
            'website' => $profile->website ?? '',
            'instagram' => $profile->instagram ?? '',
        ];
    }

    /**
     * Index 0 = Monday: list of {opens, closes}; 23:59 goes back to "24:00".
     *
     * @return list<list<array{opens: string, closes: string}>>
     */
    public static function hours(GymProfile $profile): array
    {
        $days = array_fill(0, 7, []);

        /** @var GymOpeningHour $range */
        foreach ($profile->openingHours as $range) {
            $closes = $range->closes();
            $days[$range->weekday - 1][] = [
                'opens' => $range->opens(),
                'closes' => $closes === '23:59' ? '24:00' : $closes,
            ];
        }

        return array_values($days);
    }
}
