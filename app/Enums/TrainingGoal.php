<?php

namespace App\Enums;

/** The training goal of "Completa il tuo profilo", saved in `client_preferences.goal`. */
enum TrainingGoal: string
{
    case Fitness = 'fitness';
    case Strength = 'strength';
    case Posture = 'posture';
    case Sport = 'sport';
    case Wellbeing = 'wellbeing';
}
