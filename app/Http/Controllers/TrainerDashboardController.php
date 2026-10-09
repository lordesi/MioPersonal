<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\BuildsPlaceholderData;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class TrainerDashboardController extends Controller
{
    use BuildsPlaceholderData;

    public function __invoke(Request $request): Response
    {
        // TODO: load the logged-in trainer's sessions, requests and stats from the database.
        $now = $this->romeNow();

        return Inertia::render('trainer/today', [
            'firstName' => Str::before((string) $request->user()?->name, ' '),
            'trainerArea' => $this->trainerArea(),
            'today' => [
                $this->session(1, 'Anna B.', $this->at($now, 0, 7, 30), 'Seduta singola', 'Parco Lambro'),
                $this->session(2, 'Roberto C.', $this->at($now, 0, 12), 'Pacchetto 10 · 7ª seduta', 'Studio'),
                $this->session(3, 'Luca M.', $this->at($now, 0, 18), 'Valutazione iniziale', 'Studio'),
                $this->session(4, 'Paolo R.', $this->at($now, 0, 19, 30), 'Seduta online', 'Videochiamata'),
            ],
            'requests' => [
                [
                    'id' => 1,
                    'clientName' => 'Francesca D.',
                    'start' => $this->iso($this->at($now, 1, 18)),
                    'hours' => 1,
                    'serviceName' => 'Seduta singola',
                    'placeLabel' => 'Al parco · Parco Lambro',
                    'note' => 'Prima volta con un trainer, vorrei lavorare sulla postura.',
                    'expiresAt' => $this->iso($now->addHours(5)),
                ],
                [
                    'id' => 2,
                    'clientName' => 'Marco P.',
                    'start' => $this->iso($this->at($now, 3, 7)),
                    'hours' => 2,
                    'serviceName' => 'Seduta singola',
                    'placeLabel' => 'A domicilio · Lambrate',
                    'note' => 'Preparazione per una mezza maratona a novembre.',
                    'expiresAt' => $this->iso($now->addHours(22)),
                ],
                [
                    'id' => 3,
                    'clientName' => 'Sofia L.',
                    'start' => $this->iso($this->at($now, 5, 10)),
                    'hours' => 1,
                    'serviceName' => 'Seduta online',
                    'placeLabel' => 'Videochiamata',
                    'note' => null,
                    'expiresAt' => $this->iso($now->addHours(26)),
                ],
            ],
            'stats' => [
                'sessionsThisWeek' => 12,
                'sessionsLastWeek' => 9,
                'profileViews' => 312,
                'profileBookings' => 18,
            ],
            // Pending requests and sessions to mark are added by the page itself.
            'todos' => [
                ['label' => 'Rispondi alla recensione di Marta', 'hint' => '5 stelle · 2 giorni fa', 'cta' => 'Rispondi', 'href' => route('trainer.reviews', absolute: false)],
                ['label' => 'Il pacchetto di Roberto C. sta per finire', 'hint' => 'Restano 3 sedute su 10', 'cta' => 'Apri cliente', 'href' => route('trainer.clients', absolute: false)],
                ['label' => 'Completa il profilo: aggiungi altre foto', 'hint' => 'Profilo completo all’85%', 'cta' => 'Completa', 'href' => '#'],
            ],
        ]);
    }

    /**
     * @return array{id: int, clientName: string, start: string, hours: int, serviceName: string, placeLabel: string}
     */
    private function session(int $id, string $clientName, CarbonImmutable $start, string $serviceName, string $placeLabel): array
    {
        return [
            'id' => $id,
            'clientName' => $clientName,
            'start' => $this->iso($start),
            'hours' => 1,
            'serviceName' => $serviceName,
            'placeLabel' => $placeLabel,
        ];
    }
}
