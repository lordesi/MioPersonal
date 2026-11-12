<?php

namespace App\Http\Controllers;

use App\Support\Staging;
use Illuminate\Http\Response;

/**
 * robots.txt: the rules of the real site, or "Disallow: /" on staging, so a
 * copy of the site is never indexed even if the password were lifted.
 *
 * The crawlers of the AI assistants are named one by one, with the same rules
 * as everybody: a crawler follows only its own group when it has one, and the
 * explicit welcome documents that the public pages are meant for them too
 * (the answers of ChatGPT, Claude, Perplexity and Gemini quote what they read).
 */
class RobotsController extends Controller
{
    private const PRIVATE_PATHS = [
        '/admin', '/area-trainer', '/area-cliente', '/impostazioni', '/preferiti', '/prenotazioni',
        '/completa-profilo', '/dashboard', '/settings', '/user/', '/email/', '/reset-password/',
        '/auth/', '/registrazione/', '/*/prenota$',
    ];

    /** Search and assistant crawlers: OpenAI, Anthropic, Perplexity, Google (Gemini), Apple, Microsoft. */
    private const AI_CRAWLERS = [
        'OAI-SearchBot', 'ChatGPT-User', 'GPTBot',
        'Claude-SearchBot', 'Claude-User', 'ClaudeBot',
        'PerplexityBot', 'Perplexity-User',
        'Google-Extended', 'Applebot-Extended', 'Bingbot',
    ];

    public function __invoke(): Response
    {
        if (Staging::active()) {
            $lines = ['User-agent: *', 'Disallow: /'];
        } else {
            $rules = array_map(fn (string $path) => "Disallow: {$path}", self::PRIVATE_PATHS);

            $lines = ['User-agent: *', ...$rules, ''];
            foreach (self::AI_CRAWLERS as $crawler) {
                $lines[] = "User-agent: {$crawler}";
            }
            $lines = [...$lines, 'Allow: /', ...$rules, '', 'Sitemap: '.route('sitemap')];
        }

        return response(implode("\n", $lines)."\n", 200, ['Content-Type' => 'text/plain; charset=UTF-8']);
    }
}
