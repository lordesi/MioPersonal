<?php

namespace App\Enums;

/** "Quando preferisci allenarti" of Completa profilo. Saved in the `client_preferences.times` list. */
enum PreferredTime: string
{
    case EarlyMorning = 'early_morning';
    case Morning = 'morning';
    case Lunch = 'lunch';
    case Afternoon = 'afternoon';
    case Evening = 'evening';
    case Weekend = 'weekend';
}
