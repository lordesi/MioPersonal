<?php

namespace App\Http\Controllers;

use App\Support\Features;
use App\Support\Seo;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Palestre arrivano presto": where the categories of the search lead while
 * their part of the site is off (config/features.php). Once it is on, the
 * link goes straight to its search: an old link lands there too.
 */
class ComingSoonController extends Controller
{
    /** The address word of each category, its feature and its search. */
    private const KINDS = [
        'palestre' => ['feature' => Features::GYMS, 'search' => 'gyms.search', 'label' => 'Palestre'],
        'corsi' => ['feature' => Features::COURSES, 'search' => 'courses.search', 'label' => 'Corsi'],
        'eventi' => ['feature' => Features::EVENTS, 'search' => 'events.search', 'label' => 'Eventi'],
    ];

    public function __invoke(string $kind): Response|RedirectResponse
    {
        $item = self::KINDS[$kind];

        if (Features::on($item['feature'])) {
            return redirect()->route($item['search']);
        }

        return Inertia::render('public/coming-soon', [
            'kind' => $kind,
            'seo' => Seo::page(
                title: "{$item['label']} in arrivo",
                description: "{$item['label']} su MioPersonal arrivano presto. Per ora cerca il tuo personal trainer.",
                index: false,
            ),
        ]);
    }
}
