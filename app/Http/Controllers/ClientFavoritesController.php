<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\BuildsPlaceholderData;
use Inertia\Inertia;
use Inertia\Response;

class ClientFavoritesController extends Controller
{
    use BuildsPlaceholderData;

    /** The trainers saved in the design, in its order. */
    private const SLUGS = ['giulia-rossi', 'andrea-conti', 'chiara-galli'];

    public function __invoke(): Response
    {
        // TODO: load the logged-in client's favorite trainers from the database.
        $trainers = collect($this->placeholderTrainers())->keyBy('slug');

        return Inertia::render('client/favorites', [
            'trainers' => collect(self::SLUGS)
                ->map(fn (string $slug) => $this->trainerCard($trainers[$slug]))
                ->values()
                ->all(),
        ]);
    }
}
