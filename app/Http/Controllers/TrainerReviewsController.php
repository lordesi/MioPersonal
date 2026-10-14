<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\BuildsPlaceholderData;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Recensioni" of the trainer. Empty until reviews are stored (step 6 of
 * docs/database/analisi.md): a new trainer has no reviews.
 */
class TrainerReviewsController extends Controller
{
    use BuildsPlaceholderData;

    public function __invoke(): Response
    {
        return Inertia::render('trainer/reviews', [
            'trainerArea' => $this->trainerArea(),
            // TODO (step 6): the trainer's reviews; average null = no reviews yet.
            'summary' => ['average' => null, 'count' => 0],
            'reviews' => [],
        ]);
    }
}
