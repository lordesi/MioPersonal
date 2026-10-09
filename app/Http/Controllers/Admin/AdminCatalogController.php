<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\BuildsAdminPlaceholderData;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

/** "Discipline e zone": the lists used by the search filters and the trainer profiles. */
class AdminCatalogController extends Controller
{
    use BuildsAdminPlaceholderData;

    public function __invoke(): Response
    {
        // TODO: load disciplines and zones from the database (one list for the whole app).
        $disciplines = [
            'Functional' => 18,
            'Pesi e bodybuilding' => 12,
            'Pilates' => 9,
            'Yoga' => 7,
            'Crossfit' => 5,
            'Preparazione atletica' => 6,
            'Boxe' => 4,
            'Calisthenics' => 3,
            'Postura' => 4,
            'Running' => 2,
        ];

        $zones = [
            'milano' => ['Centro', 'Brera', 'Isola', 'Porta Venezia', 'Città Studi', 'Lambrate', 'Navigli', 'Porta Romana', 'CityLife', 'San Siro', 'Bicocca'],
            'provincia' => ['Monza', 'Sesto San Giovanni', 'Rho', 'Cinisello Balsamo'],
        ];

        return Inertia::render('admin/catalog', [
            'adminArea' => $this->adminArea(),
            'disciplines' => array_map(fn (string $name, int $count, int $index) => [
                'id' => $index + 1,
                'name' => $name,
                'trainerCount' => $count,
            ], array_keys($disciplines), $disciplines, range(0, count($disciplines) - 1)),
            'zones' => array_map(fn (array $names) => array_map(
                fn (string $name) => ['name' => $name],
                $names,
            ), $zones),
        ]);
    }
}
