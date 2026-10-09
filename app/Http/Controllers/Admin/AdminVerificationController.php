<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\BuildsAdminPlaceholderData;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

/** "Verifica trainer": profiles waiting for the team's approval, oldest first. */
class AdminVerificationController extends Controller
{
    use BuildsAdminPlaceholderData;

    public function __invoke(): Response
    {
        // TODO: load the trainer profiles waiting for approval from the database.
        $now = $this->romeNow();

        // id, name, disciplines, zone, status, days since sent, bio, places,
        // services [label, cents], hours a week, certifications, warnings.
        $trainers = [
            [1, 'Marco Ferri', ['Functional', 'Kettlebell'], 'Isola, Milano', 'review', 3,
                'Allenatore da 6 anni, lavoro con chi vuole tornare in forma con allenamenti brevi e intensi. Prima seduta di valutazione gratuita.',
                ['Palestra Isola Fit (Isola)', 'Parco Biblioteca degli Alberi'],
                [['Seduta 1 ora', 4000], ['2 ore', 7500], ['Pacchetto 10 × 1 ora', 36000]], 34,
                [['ISSA Personal Trainer', 'ISSA Europe · 2020'], ['Kettlebell Instructor Level 1', 'StrongFirst · 2022']], []],
            [2, 'Sofia Bassi', ['Pilates', 'Yoga'], 'Navigli, Milano', 'review', 2,
                'Insegno pilates matwork e yoga dolce. Per info scrivimi al 333 000 0000.',
                ['Studio in via Vigevano (Navigli)', 'Online'],
                [['Seduta 1 ora', 4500]], 22,
                [['Pilates Matwork', 'Polestar · 2021']], ['La bio contiene un numero di telefono']],
            [3, 'Daniele Russo', ['Pesi', 'Bodybuilding'], 'Monza', 'review', 1,
                'Preparatore per ipertrofia e forza, anche per principianti.',
                ['Palestra Monza Centro'],
                [['Seduta 1 ora', 3500], ['2 ore', 6500]], 28,
                [['Istruttore Body Building', 'CSEN · 2019']], ['Manca la foto profilo']],
            [4, 'Laura Conti', ['Postura', 'Ginnastica dolce'], 'Città Studi, Milano', 'review', 0,
                'Laureata in Scienze Motorie, mi occupo di postura e mobilità per chi lavora seduto.',
                ['A domicilio', 'Studio Città Studi'],
                [['Seduta 1 ora', 4500], ['Valutazione 1 ora', 3000]], 30,
                [['Laurea in Scienze Motorie', 'Università di Milano · 2018'], ['Posturologia', 'AIF · 2021']], []],
            [5, 'Pietro Gallo', ['Boxe'], 'Sesto San Giovanni', 'changes', 4,
                'Maestro di boxe, lezioni individuali per tutti i livelli.',
                ['Palestra Boxe Sesto'],
                [['Seduta 1 ora', 3500]], 18,
                [], ['Nessun attestato caricato']],
        ];

        return Inertia::render('admin/verification', [
            'adminArea' => $this->adminArea(),
            'trainers' => array_map(fn (array $t) => [
                'id' => $t[0],
                'name' => $t[1],
                'disciplines' => $t[2],
                'zone' => $t[3],
                'status' => $t[4],
                // When the profile was sent (or when changes were asked, for 'changes').
                'statusSince' => $this->iso($now->subDays($t[5])->subHours(5)),
                'bio' => $t[6],
                'places' => $t[7],
                'services' => array_map(fn (array $s) => ['label' => $s[0], 'priceCents' => $s[1]], $t[8]),
                'weeklyHours' => $t[9],
                'hasIdentityDocument' => true,
                'certifications' => array_map(fn (array $c) => ['title' => $c[0], 'issuer' => $c[1]], $t[10]),
                'warnings' => $t[11],
                // TODO: link to the preview of this trainer's own profile.
                'profileHref' => route('trainers.show', 'giulia-rossi', false),
            ], $trainers),
        ]);
    }
}
