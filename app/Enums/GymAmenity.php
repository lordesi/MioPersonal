<?php

namespace App\Enums;

/**
 * "Servizi" of a gym: on the profile and in the search (?servizi=piscina,sauna).
 * Saved as a list in `gym_profiles.amenities`. Same order and labels as
 * resources/js/lib/gym.ts.
 */
enum GymAmenity: string
{
    case Weights = 'sala-pesi';
    case Cardio = 'cardio';
    case Classes = 'corsi';
    case Functional = 'functional';
    case Crossfit = 'crossfit';
    case Spinning = 'spinning';
    case YogaPilates = 'yoga-pilates';
    case MartialArts = 'arti-marziali';
    case Pool = 'piscina';
    case Sauna = 'sauna';
    case TurkishBath = 'bagno-turco';
    case Spa = 'spa';
    case PersonalTraining = 'personal-training';
    case Lockers = 'spogliatoi-docce';
    case Parking = 'parcheggio';
    case Open24h = 'aperta-24h';
    case Accessible = 'accessibile';
    case Wifi = 'wifi';

    public function label(): string
    {
        return match ($this) {
            self::Weights => 'Sala pesi',
            self::Cardio => 'Area cardio',
            self::Classes => 'Corsi di gruppo',
            self::Functional => 'Functional training',
            self::Crossfit => 'CrossFit',
            self::Spinning => 'Spinning',
            self::YogaPilates => 'Yoga e pilates',
            self::MartialArts => 'Arti marziali',
            self::Pool => 'Piscina',
            self::Sauna => 'Sauna',
            self::TurkishBath => 'Bagno turco',
            self::Spa => 'Area spa',
            self::PersonalTraining => 'Personal training',
            self::Lockers => 'Spogliatoi e docce',
            self::Parking => 'Parcheggio',
            self::Open24h => 'Aperta 24 ore',
            self::Accessible => 'Accessibile',
            self::Wifi => 'Wi-Fi',
        };
    }

    /**
     * For the selects: [{value, label}].
     *
     * @return list<array{value: string, label: string}>
     */
    public static function options(): array
    {
        return array_map(
            fn (self $amenity) => ['value' => $amenity->value, 'label' => $amenity->label()],
            self::cases(),
        );
    }
}
