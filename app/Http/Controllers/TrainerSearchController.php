<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\BuildsPlaceholderData;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * @phpstan-import-type PlaceholderTrainer from BuildsPlaceholderData
 */
class TrainerSearchController extends Controller
{
    use BuildsPlaceholderData;

    private const PER_PAGE = 12;

    /** URL value => label. The values are the same as in the home search form. */
    private const DISCIPLINES = [
        'functional-training' => 'Functional',
        'pesi-bodybuilding' => 'Pesi',
        'pilates' => 'Pilates',
        'yoga' => 'Yoga',
        'crossfit' => 'Crossfit',
        'boxe' => 'Boxe',
        'calisthenics' => 'Calisthenics',
    ];

    private const ZONES = [
        'citta-studi' => 'Città Studi',
        'citylife' => 'CityLife',
        'lambrate' => 'Lambrate',
        'navigli' => 'Navigli',
        'porta-romana' => 'Porta Romana',
        'porta-venezia' => 'Porta Venezia',
        'monza' => 'Monza',
    ];

    /** "Disponibilità": the first free slot must be at most this many days from today. */
    private const AVAILABILITY_DAYS = ['oggi' => 0, '3-giorni' => 2, 'settimana' => 6];

    /** "Prezzo a seduta": [min, max] in cents. */
    private const PRICE_RANGES = [
        'fino-35' => [0, 3500],
        '35-45' => [3500, 4500],
        '45-60' => [4500, 6000],
        'oltre-60' => [6001, PHP_INT_MAX],
    ];

    private const MIN_TOP_RATING = 4.5;

    public function __invoke(Request $request): Response
    {
        $filters = $this->filters($request);

        // TODO: query the approved trainers from the database with these filters
        // (profiles waiting for approval never show up here).
        $trainers = $this->sort(
            $this->filter($this->placeholderTrainers(), $filters),
            $filters['ordina'],
        );

        $lastPage = max(1, (int) ceil(count($trainers) / self::PER_PAGE));
        $page = min(max(1, $request->integer('pagina', 1)), $lastPage);
        $pageTrainers = array_slice($trainers, ($page - 1) * self::PER_PAGE, self::PER_PAGE);

        return Inertia::render('public/search', [
            'trainers' => array_map(fn (array $trainer) => $this->trainerCard($trainer), $pageTrainers),
            'total' => count($trainers),
            'pagination' => ['currentPage' => $page, 'lastPage' => $lastPage],
            'filters' => $filters,
            'disciplines' => $this->options(self::DISCIPLINES),
            'zones' => $this->options(self::ZONES),
        ]);
    }

    /**
     * The filters in the URL. Unknown values are ignored instead of showing an error.
     *
     * @return array<string, string|null>
     */
    private function filters(Request $request): array
    {
        $allowed = [
            'disciplina' => array_keys(self::DISCIPLINES),
            'zona' => array_keys(self::ZONES),
            'modalita' => ['presenza', 'online'],
            'disponibilita' => array_keys(self::AVAILABILITY_DAYS),
            'prezzo' => array_keys(self::PRICE_RANGES),
            'valutazione' => ['4-5'],
            'domicilio' => ['1'],
            'ordina' => ['slot', 'prezzo', 'valutazione'],
        ];

        $filters = [];

        foreach ($allowed as $name => $values) {
            $value = $request->string($name)->value();
            $filters[$name] = in_array($value, $values, true) ? $value : null;
        }

        return $filters;
    }

    /**
     * @param  list<PlaceholderTrainer>  $trainers
     * @param  array<string, string|null>  $filters
     * @return list<PlaceholderTrainer>
     */
    private function filter(array $trainers, array $filters): array
    {
        return array_values(array_filter($trainers, function (array $trainer) use ($filters): bool {
            $discipline = $filters['disciplina'];

            if ($discipline !== null && ! in_array(self::DISCIPLINES[$discipline], $trainer['disciplines'], true)) {
                return false;
            }

            if ($filters['zona'] !== null && $trainer['zoneSlug'] !== $filters['zona']) {
                return false;
            }

            if ($filters['modalita'] === 'presenza' && ! $this->trainsInPerson($trainer)) {
                return false;
            }

            if ($filters['modalita'] === 'online' && ! $this->trainsOnline($trainer)) {
                return false;
            }

            $availability = $filters['disponibilita'];

            if ($availability !== null && $trainer['nextSlotInDays'] > self::AVAILABILITY_DAYS[$availability]) {
                return false;
            }

            if ($filters['prezzo'] !== null) {
                [$min, $max] = self::PRICE_RANGES[$filters['prezzo']];

                if ($trainer['priceFromCents'] < $min || $trainer['priceFromCents'] > $max) {
                    return false;
                }
            }

            if ($filters['valutazione'] !== null && ($trainer['rating'] ?? 0) < self::MIN_TOP_RATING) {
                return false;
            }

            if ($filters['domicilio'] !== null && ! in_array('home', $trainer['places'], true)) {
                return false;
            }

            return true;
        }));
    }

    /**
     * "Più pertinenti" (no sort) keeps the original order.
     *
     * @param  list<PlaceholderTrainer>  $trainers
     * @return list<PlaceholderTrainer>
     */
    private function sort(array $trainers, ?string $sort): array
    {
        usort($trainers, fn (array $a, array $b): int => match ($sort) {
            'slot' => $a['nextSlotInDays'] <=> $b['nextSlotInDays'],
            'prezzo' => $a['priceFromCents'] <=> $b['priceFromCents'],
            'valutazione' => ($b['rating'] ?? 0) <=> ($a['rating'] ?? 0),
            default => 0,
        });

        return $trainers;
    }

    /**
     * @param  array<string, string>  $labels
     * @return list<array{value: string, label: string}>
     */
    private function options(array $labels): array
    {
        return array_map(
            fn (string $value, string $label) => ['value' => $value, 'label' => $label],
            array_keys($labels),
            $labels,
        );
    }
}
