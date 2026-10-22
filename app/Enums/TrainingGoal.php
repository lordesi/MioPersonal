<?php

namespace App\Enums;

/**
 * A training goal: the client's one in `client_preferences.goal`, the trainer's
 * list in `trainer_profiles.goals`, and the "Obiettivo" filter of the search.
 * Training goals only: "Rientro post-infortunio" of the design is left out
 * because it is health data.
 */
enum TrainingGoal: string
{
    case WeightLoss = 'weight_loss';
    case Muscle = 'muscle';
    case Posture = 'posture';
    case Athletic = 'athletic';
    case Endurance = 'endurance';
    case Wellbeing = 'wellbeing';
}
