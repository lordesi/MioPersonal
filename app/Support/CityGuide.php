<?php

namespace App\Support;

use App\Models\City;
use App\Models\TrainerProfile;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

/**
 * The text of the indexed search pages ("Personal trainer a Milano", "Pilates
 * in Italia"): a few lines with the real numbers and the questions people ask
 * search engines and AI assistants ("Quanto costa un personal trainer a
 * Milano?"), answered with the same numbers. The page shows them and the
 * FAQPage JSON-LD repeats them, so what is quoted is what the visitor reads.
 *
 * In a city only the trainers working there in person count (not the
 * online-only ones shown in every city), as for the indexing.
 */
final class CityGuide
{
    /**
     * @param  array{value: string, label: string}|null  $discipline
     * @return array{intro: string, faq: list<array{question: string, answer: string}>}|null
     */
    public static function for(?City $city, ?array $discipline): ?array
    {
        $profiles = TrainerProfile::query()
            ->published()
            ->when($city !== null, fn (Builder $query) => $query->basedIn($city->id))
            ->when($discipline !== null, fn (Builder $query) => $query->whereHas('disciplines', fn (Builder $chosen) => $chosen->where('slug', $discipline['value'])))
            ->with(['disciplines:id,slug,name', 'city:id,name', 'otherCities:id,name'])
            ->get(['id', 'city_id', 'price_from_cents', 'trains_online', 'rating_count', 'rating_sum']);

        if ($profiles->isEmpty()) {
            return null;
        }

        $facts = self::facts($profiles, $discipline);

        return [
            'intro' => self::intro($facts, $city, $discipline),
            'faq' => self::faq($facts, $city, $discipline),
        ];
    }

    /**
     * @param  Collection<int, TrainerProfile>  $profiles
     * @param  array{value: string, label: string}|null  $discipline
     * @return array{count: int, cities: int, disciplines: list<string>, moreDisciplines: bool, minPrice: int|null, avgPrice: int|null, online: int, rating: float|null, reviews: int}
     */
    private static function facts(Collection $profiles, ?array $discipline): array
    {
        // The most common disciplines first. "Pesi e bodybuilding" has its own "e": commas only.
        $names = $discipline === null
            ? $profiles->flatMap->disciplines->countBy('name')->sortDesc()->keys()
            : collect();
        $prices = $profiles->pluck('price_from_cents')->filter();
        $reviews = (int) $profiles->sum('rating_count');

        return [
            'count' => $profiles->count(),
            'cities' => $profiles->flatMap(fn (TrainerProfile $profile) => [$profile->city?->name, ...$profile->otherCities->pluck('name')])->filter()->unique()->count(),
            'disciplines' => array_values($names->take(3)->map(fn (string $name) => mb_strtolower($name))->all()),
            'moreDisciplines' => $names->count() > 3,
            'minPrice' => $prices->isEmpty() ? null : (int) $prices->min(),
            // Rounded to the euro: "45 €", not "44,67 €".
            'avgPrice' => $prices->count() < 2 ? null : (int) (round($prices->avg() / 100) * 100),
            'online' => $profiles->where('trains_online', true)->count(),
            'rating' => $reviews === 0 ? null : round($profiles->sum('rating_sum') / $reviews, 1),
            'reviews' => $reviews,
        ];
    }

    /**
     * "A Milano ci sono 5 personal trainer verificati su MioPersonal, per
     * discipline come pilates, yoga e functional training. Le sedute partono
     * da 30 € e 2 trainer allenano anche online. …"
     *
     * @param  array<string, mixed>  $facts
     * @param  array{value: string, label: string}|null  $discipline
     */
    private static function intro(array $facts, ?City $city, ?array $discipline): string
    {
        $count = $facts['count'];
        $verified = $count === 1 ? '1 personal trainer verificato' : "{$count} personal trainer verificati";
        $topic = $discipline === null ? '' : ' di '.mb_strtolower($discipline['label']);
        $sentences = [];

        if ($city !== null) {
            $there = $count === 1 ? "c'è {$verified}" : "ci sono {$verified}";
            $first = "A {$city->name} {$there}{$topic} su MioPersonal";
        } else {
            $where = $facts['cities'] > 1 ? " in {$facts['cities']} città italiane" : ' in Italia';
            $first = "Su MioPersonal ci sono {$verified}{$topic}{$where}";
        }
        $sentences[] = $first.self::disciplineList($facts).'.';

        $online = $facts['online'];
        $onlineLabel = match (true) {
            $online === 0 => null,
            $count === 1 => 'si allena anche online',
            $online === $count => 'tutti allenano anche online',
            $online === 1 => '1 trainer allena anche online',
            default => "{$online} trainer allenano anche online",
        };
        $details = array_filter([
            $facts['minPrice'] ? 'le sedute partono da '.Seo::euros($facts['minPrice']) : null,
            $onlineLabel,
        ]);
        if ($details !== []) {
            $sentences[] = ucfirst(implode(' e ', $details)).'.';
        }

        if ($facts['rating'] !== null) {
            $sentences[] = 'La valutazione media è '.self::rating($facts['rating']).'/5 su '.self::reviews($facts['reviews']).'.';
        }

        $sentences[] = 'Confronta profili, prezzi e recensioni di clienti reali e chiedi la tua prima seduta.';

        return implode(' ', $sentences);
    }

    /**
     * @param  array<string, mixed>  $facts
     * @param  array{value: string, label: string}|null  $discipline
     * @return list<array{question: string, answer: string}>
     */
    private static function faq(array $facts, ?City $city, ?array $discipline): array
    {
        $where = $city === null ? 'in Italia' : "a {$city->name}";
        $topic = $discipline === null ? '' : ' di '.mb_strtolower($discipline['label']);
        $count = $facts['count'] === 1 ? '1 personal trainer' : "{$facts['count']} personal trainer";
        $faq = [];

        $faq[] = [
            'question' => "Dove trovare un personal trainer{$topic} {$where}?",
            'answer' => "Su MioPersonal trovi {$count}{$topic} {$where}".self::disciplineList($facts).'. '
                .'Ogni profilo è controllato dal team di MioPersonal prima della pubblicazione e mostra discipline, esperienza, prezzi, orari liberi e recensioni di clienti che hanno fatto una seduta. '
                .'Puoi chiedere la prima seduta direttamente dal profilo del trainer.',
        ];

        if ($facts['minPrice'] !== null) {
            $average = $facts['avgPrice'] === null ? '' : ', in media da '.Seo::euros($facts['avgPrice']);
            $faq[] = [
                'question' => "Quanto costa un personal trainer{$topic} {$where}?",
                'answer' => "Su MioPersonal le sedute con un personal trainer{$topic} {$where} partono da ".Seo::euros($facts['minPrice'])."{$average} a seduta. "
                    .'Il prezzo cambia con la durata, il luogo (studio privato, palestra, domicilio, parco o online) e i pacchetti di più sedute: ogni trainer mostra le sue tariffe sul profilo. '
                    .'Durante la beta MioPersonal è gratuito per i clienti e non incassa pagamenti: paghi direttamente il trainer.',
            ];
        }

        $faq[] = [
            'question' => 'Come scegliere il personal trainer giusto?',
            'answer' => 'Parti dal tuo obiettivo (per esempio perdere peso, tonificare, aumentare la massa o prepararti a una gara) e dalla disciplina che ti piace, poi confronta esperienza, recensioni e prezzo. '
                .'Su MioPersonal puoi filtrare per disciplina, obiettivo, prezzo, valutazione, giorni liberi e allenamento a domicilio, e vedere le recensioni lasciate solo da chi ha fatto una seduta con il trainer.',
        ];

        if ($facts['online'] > 0) {
            $online = $facts['online'] === 1 ? '1 trainer' : "{$facts['online']} trainer";
            $faq[] = [
                'question' => "Si può fare personal training online {$where}?",
                'answer' => "Sì: su MioPersonal {$online}{$topic} {$where} ".($facts['online'] === 1 ? 'allena' : 'allenano').' anche online, con sedute a distanza. '
                    .'Nella ricerca puoi scegliere la modalità «Online» per vedere anche i trainer che lavorano solo a distanza, da qualsiasi città.',
            ];
        }

        if ($facts['rating'] !== null) {
            $faq[] = [
                'question' => "Come sono valutati i personal trainer{$topic} {$where}?",
                'answer' => "La valutazione media dei personal trainer{$topic} {$where} su MioPersonal è ".self::rating($facts['rating']).'/5 su '.self::reviews($facts['reviews']).'. '
                    .'Può lasciare una recensione solo chi ha svolto una seduta confermata con il trainer, e il trainer può rispondere pubblicamente.',
            ];
        }

        return $faq;
    }

    /**
     * ", per discipline come pilates, yoga e functional training" (or nothing).
     *
     * @param  array<string, mixed>  $facts
     */
    private static function disciplineList(array $facts): string
    {
        if ($facts['disciplines'] === []) {
            return '';
        }

        return ', per discipline come '.implode(', ', $facts['disciplines']).($facts['moreDisciplines'] ? ' e altre' : '');
    }

    private static function rating(float $rating): string
    {
        return str_replace('.', ',', (string) $rating);
    }

    private static function reviews(int $count): string
    {
        return $count === 1 ? '1 recensione' : "{$count} recensioni";
    }
}
