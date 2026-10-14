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
