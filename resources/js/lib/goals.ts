/** The values of App\Enums\TrainingGoal. */
export type TrainingGoal =
    | 'weight_loss'
    | 'muscle'
    | 'posture'
    | 'athletic'
    | 'endurance'
    | 'wellbeing';

/**
 * The training goals of the design: the client's one ("Modifica il mio
 * profilo"), the ones a trainer works on (step 3 of the trainer form) and the
 * "Obiettivo" filter of the search. Training goals only: never health data
 * (conditions, injuries…), so "Rientro post-infortunio" is left out.
 */
export const trainingGoals: { value: TrainingGoal; label: string }[] = [
    { value: 'weight_loss', label: 'Dimagrimento' },
    { value: 'muscle', label: 'Massa muscolare e tonificazione' },
    { value: 'posture', label: 'Postura' },
    { value: 'athletic', label: 'Preparazione atletica' },
    { value: 'endurance', label: 'Corsa e endurance' },
    { value: 'wellbeing', label: 'Salute e benessere generale' },
];
