<?php

namespace App\Support;

use App\Enums\UserRole;
use App\Models\TrainerProfile;
use App\Models\User;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;

/**
 * A trainer profile in the format of the search and home cards
 * (TrainerSummary in resources/js/types/trainer.ts).
 */
final class TrainerCard
{
    /** The relations a card reads: load them to avoid one query per card. */
    public const RELATIONS = ['user', 'city', 'disciplines', 'portrait'];

    /**
     * @return array<string, mixed>
     */
    public static function from(TrainerProfile $profile): array
    {
        return [
            'slug' => $profile->slug,
            'name' => $profile->user->name,
            'href' => route('trainers.show', $profile->slug, false),
            'city' => self::cityLabel($profile),
            'disciplines' => $profile->disciplines->pluck('name')->all(),
            'rating' => $profile->rating(),
            'reviewCount' => $profile->rating_count,
            'priceFromCents' => $profile->price_from_cents ?? 0,
            'nextSlotLabel' => self::slotLabel($profile->next_free_slot_at),
            'online' => self::online($profile),
            'photoUrl' => $profile->portrait?->url(),
        ];
    }

    /**
     * The trainers a client saved, for the heart of the cards (empty for guests and the other roles).
     *
     * @return list<int>
     */
    public static function favoriteIds(?User $user): array
    {
        if ($user?->role !== UserRole::Client) {
            return [];
        }

        return array_values(array_map(intval(...), $user->favoriteTrainers()->pluck('trainer_profiles.id')->all()));
    }

    /** "Milano", or "Solo online". */
    public static function cityLabel(TrainerProfile $profile): string
    {
        return $profile->city->name ?? 'Solo online';
    }

    /** 'also' = in person and online, 'only' = online only. */
    public static function online(TrainerProfile $profile): ?string
    {
        if (! $profile->trains_online) {
            return null;
        }

        return $profile->trains_in_person ? 'also' : 'only';
    }

    /** "oggi 19:30", "domani 18:00" or "mer 7, 13:00", in Rome time; null without free slots. */
    public static function slotLabel(?CarbonInterface $slot, ?CarbonImmutable $now = null): ?string
    {
        if ($slot === null) {
            return null;
        }

        $slot = CarbonImmutable::instance($slot)->setTimezone(TrainerSlots::TIMEZONE);
        $today = ($now ?? CarbonImmutable::now())->setTimezone(TrainerSlots::TIMEZONE)->startOfDay();
        $days = (int) $today->diffInDays($slot->startOfDay());
        $weekdays = ['lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom'];

        $day = match ($days) {
            0 => 'oggi',
            1 => 'domani',
            default => "{$weekdays[$slot->dayOfWeekIso - 1]} {$slot->day},",
        };

        return "{$day} {$slot->format('H:i')}";
    }
}
