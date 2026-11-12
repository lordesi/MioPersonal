<?php

namespace App\Enums;

/** "Perché lo segnali?" of "Segnala". */
enum ReportReason: string
{
    case Fake = 'fake';
    case Offensive = 'offensive';
    case Spam = 'spam';
    case Behavior = 'behavior';
    case Other = 'other';

    public function label(): string
    {
        return match ($this) {
            self::Fake => 'Informazioni false o ingannevoli',
            self::Offensive => 'Contenuti offensivi o inappropriati',
            self::Spam => 'Spam o pubblicità',
            self::Behavior => 'Comportamento scorretto',
            self::Other => 'Altro',
        };
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    public static function options(): array
    {
        return array_map(
            fn (self $reason) => ['value' => $reason->value, 'label' => $reason->label()],
            self::cases(),
        );
    }
}
