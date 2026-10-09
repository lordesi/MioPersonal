<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('public/home', [
            'featuredTrainers' => $this->featuredTrainers(),
        ]);
    }

    /**
     * Placeholder trainers taken from docs/design until the trainers table exists.
     * TODO: load approved, featured trainers from the database (never the ones
     * still waiting for the team's approval).
     *
     * @return list<array<string, mixed>>
     */
    private function featuredTrainers(): array
    {
        return [
            [
                'name' => 'Giulia Rossi',
                'href' => route('trainers.show', 'giulia-rossi', false),
                'zone' => 'Città Studi, Milano',
                'disciplines' => ['Functional', 'Pilates'],
                'rating' => 4.9,
                'reviewCount' => 23,
                'priceFromCents' => 4500,
                'nextSlotLabel' => 'domani 18:00',
                'online' => 'also',
            ],
            [
                'name' => 'Marco Bianchi',
                'href' => route('trainers.show', 'marco-bianchi', false),
                'zone' => 'Navigli, Milano',
                'disciplines' => ['Pesi', 'Preparazione atletica'],
                'rating' => 4.8,
                'reviewCount' => 31,
                'priceFromCents' => 5000,
                'nextSlotLabel' => 'mer 7, 13:00',
                'online' => null,
            ],
            [
                'name' => 'Elena Ricci',
                'href' => route('trainers.show', 'elena-ricci', false),
                'zone' => 'Monza',
                'disciplines' => ['Pilates', 'Yoga'],
                'rating' => null,
                'reviewCount' => 0,
                'priceFromCents' => 4000,
                'nextSlotLabel' => 'domani 09:00',
                'online' => 'also',
            ],
        ];
    }
}
