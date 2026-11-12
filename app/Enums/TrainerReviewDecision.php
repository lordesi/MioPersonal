<?php

namespace App\Enums;

/** A decision of the team in "Admin · Verifica". Saved as text in `trainer_profile_reviews.decision`. */
enum TrainerReviewDecision: string
{
    case Approved = 'approved';
    case Changes = 'changes';
    case Rejected = 'rejected';
    /** "Annulla decisione": the profile goes back to "In revisione". */
    case Undone = 'undone';

    /** For the "Registro attività": "Profilo di Marco Rossi approvato". */
    public function logLabel(): string
    {
        return match ($this) {
            self::Approved => 'approvato',
            self::Changes => 'da modificare: modifiche richieste',
            self::Rejected => 'rifiutato',
            self::Undone => 'di nuovo in revisione: decisione annullata',
        };
    }

    /** The profile status after this decision. */
    public function status(): TrainerProfileStatus
    {
        return match ($this) {
            self::Approved => TrainerProfileStatus::Approved,
            self::Changes => TrainerProfileStatus::Changes,
            self::Rejected => TrainerProfileStatus::Rejected,
            self::Undone => TrainerProfileStatus::Review,
        };
    }
}
