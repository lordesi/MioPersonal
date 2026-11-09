<?php

namespace App\Http\Controllers;

use App\Support\Staging;
use Illuminate\Http\Response;

/**
 * robots.txt: the rules of the real site, or "Disallow: /" on staging, so a
 * copy of the site is never indexed even if the password were lifted.
 */
class RobotsController extends Controller
{
    private const PRIVATE_PATHS = [
        '/admin', '/area-trainer', '/area-cliente', '/impostazioni', '/preferiti', '/prenotazioni',
        '/completa-profilo', '/dashboard', '/settings', '/user/', '/email/', '/reset-password/',
        '/auth/', '/registrazione/', '/*/prenota$',
    ];

    public function __invoke(): Response
    {
        $lines = ['User-agent: *'];

        if (Staging::active()) {
            $lines[] = 'Disallow: /';
        } else {
            foreach (self::PRIVATE_PATHS as $path) {
                $lines[] = "Disallow: {$path}";
            }

            $lines[] = '';
            $lines[] = 'Sitemap: '.route('sitemap');
        }

        return response(implode("\n", $lines)."\n", 200, ['Content-Type' => 'text/plain; charset=UTF-8']);
    }
}
