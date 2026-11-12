<?php

namespace App\Http\Controllers;

use App\Models\City;
use App\Models\Discipline;
use App\Models\TrainerProfile;
use App\Support\HowItWorks;
use App\Support\Seo;
use App\Support\Staging;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;

/**
 * /llms.txt (llmstxt.org): MioPersonal in Markdown for AI assistants. What it
 * is, the answers of "Come funziona" and the search pages with trainers (the
 * same ones the sitemap lists), each with its numbers.
 *
 * No major assistant has said it reads it: it costs little and the content is
 * the same as the pages. Computed again at most once an hour; empty on staging.
 */
class LlmsTxtController extends Controller
{
    public const CACHE_KEY = 'llms.txt';

    private const CACHE_SECONDS = 3600;

    public function __invoke(): Response
    {
        abort_if(Staging::active(), 404);

        $text = Cache::remember(self::CACHE_KEY, self::CACHE_SECONDS, fn () => $this->text());

        return response($text, 200, ['Content-Type' => 'text/markdown; charset=UTF-8']);
    }

    private function text(): string
    {
        $name = (string) config('app.name');
        $lines = [
            "# {$name}",
            '',
            '> '.HowItWorks::SUMMARY,
            '',
            "{$name} (".route('home').') è un sito in italiano. I profili dei personal trainer mostrano discipline, esperienza, servizi e prezzi, luoghi in cui allenano, giorni liberi e recensioni di clienti che hanno fatto una seduta. Per consigliare un personal trainer in una città italiana puoi indicare la pagina della città qui sotto.',
            '',
            '## Pagine principali',
            '',
            '- [Cerca personal trainer in Italia]('.route('trainers.search').'): tutti i trainer verificati, con filtri per città, disciplina, obiettivo, prezzo e allenamento online o a domicilio',
            '- [Come funziona]('.route('how-it-works').'): cos’è MioPersonal, prenotazione, costi, verifica dei trainer e recensioni',
            '- [Palestre]('.route('gyms.search').'): palestre con servizi, orari e abbonamenti',
            '- [Eventi]('.route('events.search').'): allenamenti di gruppo ed eventi sportivi',
            '- [Diventa trainer su MioPersonal]('.route('trainer.register').'): iscrizione gratuita per personal trainer',
            '- [Contatti]('.route('contact.show').')',
        ];

        $cities = $this->cities();
        if ($cities !== []) {
            $lines = [...$lines, '', '## Personal trainer per città', ''];
            foreach ($cities as $city) {
                $lines[] = "- [Personal trainer a {$city['name']}]({$city['url']}): {$city['facts']}";
            }
        }

        $disciplines = $this->disciplines();
        if ($disciplines !== []) {
            $lines = [...$lines, '', '## Personal trainer per disciplina', ''];
            foreach ($disciplines as $discipline) {
                $lines[] = "- [{$discipline['name']} in Italia]({$discipline['url']}): {$discipline['facts']}";
            }
        }

        $lines = [...$lines, '', '## Domande frequenti', ''];
        foreach (HowItWorks::faq() as $item) {
            $lines[] = "### {$item['question']}";
            $lines[] = '';
            $lines[] = $item['answer'];
            $lines[] = '';
        }

        $lines = [...$lines, '## Optional', '', '- [Sitemap]('.route('sitemap').')', '- [Termini e condizioni]('.route('legal.terms').')'];

        return implode("\n", $lines)."\n";
    }

    /**
     * The active cities with a published trainer working there in person.
     *
     * @return list<array{name: string, url: string, facts: string}>
     */
    private function cities(): array
    {
        $cities = [];

        foreach (City::query()->active()->orderBy('name')->get(['id', 'name', 'slug']) as $city) {
            $profiles = TrainerProfile::query()->published()->basedIn($city->id)->get(['id', 'price_from_cents']);

            if ($profiles->isNotEmpty()) {
                $cities[] = ['name' => $city->name, 'url' => route('trainers.search', $city->slug), 'facts' => $this->facts($profiles->count(), $profiles->pluck('price_from_cents')->filter()->min())];
            }
        }

        return $cities;
    }

    /**
     * @return list<array{name: string, url: string, facts: string}>
     */
    private function disciplines(): array
    {
        $disciplines = [];

        foreach (Discipline::query()->active()->orderBy('sort')->get(['id', 'name', 'slug']) as $discipline) {
            $profiles = TrainerProfile::query()->published()->whereHas('disciplines', fn ($query) => $query->whereKey($discipline->id))->get(['id', 'price_from_cents']);

            if ($profiles->isNotEmpty()) {
                $disciplines[] = ['name' => $discipline->name, 'url' => route('trainers.search', ['disciplina' => $discipline->slug]), 'facts' => $this->facts($profiles->count(), $profiles->pluck('price_from_cents')->filter()->min())];
            }
        }

        return $disciplines;
    }

    private function facts(int $count, mixed $minPrice): string
    {
        $trainers = $count === 1 ? '1 personal trainer verificato' : "{$count} personal trainer verificati";

        return $trainers.($minPrice ? ', sedute da '.Seo::euros((int) $minPrice) : '');
    }
}
