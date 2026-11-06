<?php

namespace App\Enums;

/** How long a gym plan lasts. Saved as text in `gym_plans.period`. */
enum GymPlanPeriod: string
{
    case Monthly = 'monthly';
    case Quarterly = 'quarterly';
    case Yearly = 'yearly';
    /** A pack of entries ("10 ingressi"): entries_count. */
    case Entries = 'entries';

    public function label(): string
    {
        return match ($this) {
            self::Monthly => 'Mensile',
            self::Quarterly => 'Trimestrale',
            self::Yearly => 'Annuale',
            self::Entries => 'Ingressi',
        };
    }

    /** "/mese", "/trimestre"… after the price; the entries say how many. */
    public function suffix(?int $entries = null): string
    {
        return match ($this) {
            self::Monthly => '/mese',
            self::Quarterly => '/trimestre',
            self::Yearly => '/anno',
            self::Entries => $entries === 1 ? 'per 1 ingresso' : "per {$entries} ingressi",
        };
    }

    /** The same price over one month, for "da X €/mese"; entries have none. */
    public function monthlyCents(int $priceCents): ?int
    {
        return match ($this) {
            self::Monthly => $priceCents,
            self::Quarterly => (int) round($priceCents / 3),
            self::Yearly => (int) round($priceCents / 12),
            self::Entries => null,
        };
    }
}
