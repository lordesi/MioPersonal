<?php

namespace App\Enums;

/** Where a trainer profile is in the team's approval. Saved as text in `trainer_profiles.status`. */
enum TrainerProfileStatus: string
{
    /** Sent, waiting for the team ("In revisione"). */
    case Review = 'review';
    /** The team asked for changes: the trainer fixes the profile and sends it again. */
    case Changes = 'changes';
    /** Public: it can show up in the search. */
    case Approved = 'approved';
    case Rejected = 'rejected';
}
