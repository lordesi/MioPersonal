<?php

namespace Database\Seeders;

use App\Actions\Trainer\SaveTrainerProfile;
use App\Enums\BookingStatus;
use App\Enums\TrainerProfileStatus;
use App\Enums\TrainerReviewDecision;
use App\Enums\UserRole;
use App\Models\Booking;
use App\Models\Service;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Support\TrainerSlots;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Random\Engine\Mt19937;
use Random\Randomizer;

/**
 * Example trainers for local development only (DatabaseSeeder calls it when
 * APP_ENV=local): the 9 trainers of the search design, approved, and 5
 * profiles waiting in "Admin · Verifica". It can run again: it updates them.
 * Emails are …@demo.miopersonal.test, the password is "password".
 *
 * The approved trainers get example reviews, written by 12 demo clients and
 * not linked to a booking, with the average of the search design. Giulia
 * Rossi also gets bookings and a package, for her area trainer.
 */
class DemoTrainerSeeder extends Seeder
{
    /** Start hours of each time of day. */
    private const TIMES = [
        'early-morning' => [7, 8],
        'morning' => [9, 10, 11],
        'lunch' => [12, 13],
        'afternoon' => [14, 15, 16, 17],
        'evening' => [18, 19, 20],
    ];

    public function run(SaveTrainerProfile $saver): void
    {
        // name, city, other cities, disciplines, goals, rating, reviews, price in cents, places, times, headline
        $approved = [
            ['Giulia Rossi', 'milano', ['monza'], ['functional', 'pilates', 'postura'], ['weight_loss', 'posture', 'wellbeing'], 4.9, 23, 4500, ['studio', 'home', 'park', 'online'], [], 'Functional training e Pilates'],
            ['Marco Bianchi', 'milano', [], ['pesi-e-bodybuilding', 'preparazione-atletica'], ['muscle', 'weight_loss'], 4.8, 31, 5000, ['studio'], ['lunch', 'afternoon', 'evening'], 'Forza e ipertrofia, anche per principianti'],
            ['Sara Colombo', null, [], ['yoga', 'pilates'], ['wellbeing', 'posture'], 5.0, 12, 3000, ['online'], ['early-morning', 'lunch', 'evening'], 'Yoga e Pilates online'],
            ['Luca Ferrari', 'torino', [], ['crossfit', 'functional'], ['weight_loss', 'muscle', 'athletic'], 4.7, 18, 4500, ['studio', 'park'], ['early-morning', 'evening'], 'Crossfit e allenamento funzionale'],
            ['Elena Ricci', 'monza', ['milano'], ['pilates', 'yoga'], ['posture', 'wellbeing'], null, 0, 4000, ['studio', 'home', 'online'], ['morning', 'afternoon'], 'Pilates e Yoga per tutti i livelli'],
            ['Davide Greco', 'bergamo', [], ['boxe', 'functional'], ['weight_loss', 'athletic'], 4.9, 9, 3500, ['studio', 'home'], ['afternoon', 'evening', 'weekend'], 'Boxe e preparazione fisica'],
            ['Chiara Galli', 'roma', [], ['yoga'], ['wellbeing'], 4.8, 27, 3800, ['park', 'online'], ['morning', 'weekend'], 'Yoga all’aperto e online'],
            ['Andrea Conti', 'milano', [], ['calisthenics', 'pesi-e-bodybuilding'], ['muscle', 'weight_loss'], 4.6, 14, 4000, ['home', 'park', 'online'], ['early-morning', 'evening', 'weekend'], 'Calisthenics a corpo libero'],
            ['Francesca Marino', 'roma', [], ['preparazione-atletica', 'pesi-e-bodybuilding'], ['athletic', 'muscle'], null, 0, 5500, ['studio', 'home'], ['early-morning', 'lunch'], 'Preparazione atletica per gare amatoriali'],
        ];

        $clients = $this->clients();

        foreach ($approved as [$name, $city, $otherCities, $disciplines, $goals, $rating, $reviews, $price, $places, $times, $headline]) {
            $profile = $this->trainer($saver, $name, $city, $otherCities, $disciplines, $price, $places, $times, $headline, goals: $goals);
            $profile->forceFill([
                'status' => TrainerProfileStatus::Approved,
                'status_changed_at' => now()->subMonths(2),
                'approved_at' => now()->subMonths(2),
            ])->save();

            $this->reviews($profile, $clients, $rating ?? 5.0, $reviews);
        }

        $this->giuliaServices();
        $this->giuliaBookings($clients);

        // name, city, disciplines, status, days since sent, bio
        $waiting = [
            ['Marco Ferri', 'milano', ['functional', 'crossfit'], TrainerProfileStatus::Review, 3, 'Allenatore da 6 anni, lavoro con chi vuole tornare in forma con allenamenti brevi e intensi. Prima seduta di valutazione gratuita, poi un programma su misura.'],
            ['Sofia Bassi', 'roma', ['pilates', 'yoga'], TrainerProfileStatus::Review, 2, 'Insegno pilates matwork e yoga dolce, in studio e online. Per info scrivimi al 333 000 0000, ti rispondo in giornata e organizziamo la prima lezione.'],
            ['Daniele Russo', 'monza', ['pesi-e-bodybuilding'], TrainerProfileStatus::Review, 1, 'Preparatore per ipertrofia e forza, anche per principianti. Ti seguo in palestra con un programma scritto e controlli periodici dei progressi.'],
            ['Laura Conti', 'torino', ['postura', 'pilates'], TrainerProfileStatus::Review, 0, 'Laureata in Scienze Motorie, mi occupo di postura e mobilità per chi lavora seduto. Esercizi semplici da fare anche a casa tra una seduta e l’altra.'],
            ['Pietro Gallo', 'bergamo', ['boxe'], TrainerProfileStatus::Changes, 4, 'Maestro di boxe, lezioni individuali per tutti i livelli: tecnica, sacco e preparazione fisica. Guantoni e bende li porto io per la prima lezione.'],
        ];

        foreach ($waiting as [$name, $city, $disciplines, $status, $days, $bio]) {
            $profile = $this->trainer($saver, $name, $city, [], $disciplines, 4000, ['studio'], ['morning', 'evening'], 'Personal trainer', $bio);
            $profile->forceFill(['status' => $status, 'status_changed_at' => now()->subDays($days)->subHours(5)])->save();

            if ($status === TrainerProfileStatus::Changes && ! $profile->decisions()->exists()) {
                $profile->decisions()->create([
                    'decision' => TrainerReviewDecision::Changes,
                    'reasons' => ['Attestato mancante o illeggibile'],
                    'message_to_trainer' => 'Ciao, manca poco! Carica l’attestato da maestro di boxe e reinvia il profilo.',
                ]);
            }
        }
    }

    /**
     * Creates (or updates) the user and saves the profile like the registration does.
     *
     * @param  list<string>  $otherCities
     * @param  list<string>  $disciplines
     * @param  list<string>  $places
     * @param  list<string>  $times  empty = the hours of the registration example
     * @param  list<string>  $goals  App\Enums\TrainingGoal values
     */
    private function trainer(SaveTrainerProfile $saver, string $name, ?string $city, array $otherCities, array $disciplines, int $price, array $places, array $times, string $headline, ?string $bio = null, array $goals = ['weight_loss']): TrainerProfile
    {
        [$firstName, $lastName] = explode(' ', $name, 2);

        $user = User::firstOrNew(['email' => Str::slug($name).'@demo.miopersonal.test']);
        $user->forceFill([
            'first_name' => $firstName,
            'last_name' => $lastName,
            'password' => 'password',
            'role' => UserRole::Trainer,
            'email_verified_at' => now(),
            'terms_accepted_at' => now(),
        ])->save();

        return $saver->handle($user, [
            'headline' => $headline,
            'bio' => $bio ?? $this->bio($firstName, $headline),
            'experience' => '5to10',
            'disciplines' => $disciplines,
            'goals' => $goals,
            'places' => $places,
            'studios' => in_array('studio', $places, true) ? [['name' => "Studio {$lastName}", 'address' => 'Via Roma 10']] : [],
            'city' => $city,
            'other_cities' => $otherCities,
            // "Servizi e prezzi": 1 hour, 1 hour and a half, 2 hours (each with its
            // own price, in whole euros) and a package of 10 one-hour sessions.
            'sessions' => [[
                'name' => 'Seduta singola',
                'prices' => [
                    ['minutes' => 60, 'price_cents' => $price],
                    ['minutes' => 90, 'price_cents' => intdiv($price * 14, 1000) * 100],
                    ['minutes' => 120, 'price_cents' => intdiv($price * 18, 1000) * 100],
                ],
            ]],
            'packages' => [['sessions' => 10, 'minutes' => 60, 'price_cents' => $price * 9]],
            'hours' => $this->hours($times),
            'notice_hours' => 12,
            'booking_window_days' => 60,
            'break_minutes' => 15,
            'max_sessions_per_day' => 6,
            'free_cancellation_hours' => 24,
            'auto_confirm' => false,
            'certifications' => [
                ['title' => 'Laurea in Scienze Motorie', 'issuer' => 'Università degli Studi', 'year' => 2016],
            ],
        ]);
    }

    private function bio(string $firstName, string $headline): string
    {
        return "Ciao, sono {$firstName}. {$headline}: alleno persone che vogliono tornare in forma dopo una pausa o migliorare i propri risultati.\n\n"
            .'Nella prima seduta facciamo una valutazione insieme e fissiamo un obiettivo realistico, poi ti preparo un programma su misura.';
    }

    /**
     * Weekly hours (0 = Monday) from the times of day. Weekdays get the times,
     * "weekend" adds Saturday morning.
     *
     * @param  list<string>  $times
     * @return array<int, list<int>>
     */
    private function hours(array $times): array
    {
        // The example of the registration (and of the design).
        if ($times === []) {
            return [
                [7, 8, 9, 10, 11, 18, 19, 20],
                [12, 13, 14, 15, 16, 17, 18, 19, 20],
                [7, 8, 9, 10, 11, 18, 19, 20],
                [12, 13, 14, 15, 16, 17, 18, 19, 20],
                [7, 8, 9, 10, 11, 12],
                [8, 9, 10, 11, 12, 13],
                [],
            ];
        }

        $weekday = array_merge(...array_map(fn (string $time) => self::TIMES[$time] ?? [], $times));
        $hours = array_fill(0, 5, $weekday);
        $hours[5] = in_array('weekend', $times, true) ? [9, 10, 11, 12] : [];
        $hours[6] = [];

        return $hours;
    }

    /**
     * The demo clients who write the reviews (they can log in too).
     *
     * @return list<User>
     */
    private function clients(): array
    {
        $names = [
            'Anna Bianchi', 'Paolo Verdi', 'Martina Esposito', 'Luca Romano', 'Silvia Fontana', 'Matteo Moretti',
            'Giorgia Barbieri', 'Stefano Lombardi', 'Valentina Rinaldi', 'Federico Caruso', 'Alessia Ferrara', 'Simone Mancini',
        ];

        return array_map(function (string $name) {
            [$firstName, $lastName] = explode(' ', $name, 2);

            $user = User::firstOrNew(['email' => Str::slug($name).'@demo.miopersonal.test']);
            $user->forceFill([
                'first_name' => $firstName,
                'last_name' => $lastName,
                'password' => 'password',
                'role' => UserRole::Client,
                'email_verified_at' => now(),
                'terms_accepted_at' => now(),
            ])->save();

            return $user;
        }, $names);
    }

    /**
     * `$count` example reviews whose average is `$average`, from today back by
     * about a week each; a third of them with the trainer's reply. The same
     * trainer always gets the same reviews.
     *
     * @param  list<User>  $clients
     */
    private function reviews(TrainerProfile $profile, array $clients, float $average, int $count): void
    {
        $texts = [
            5 => [
                'Allenamenti sempre diversi e mai noiosi. Dopo due mesi salgo le scale senza fiatone e la schiena non mi fa più male a fine giornata.',
                'Puntualità, preparazione e tanta attenzione alla tecnica. Già dalla prima seduta ho corretto la postura nello squat.',
                'Finalmente qualcuno che mi fa venire voglia di allenarmi. Il programma da fare a casa è chiaro e veloce.',
                'Super consigliato! Spiega bene ogni esercizio e adatta la seduta a come ti senti quel giorno.',
                'Ho iniziato da zero e ogni esercizio è stato spiegato passo passo. Risultati visibili già dopo poche settimane.',
                'Professionalità e simpatia. Le sedute volano e si torna a casa con il sorriso.',
                'Ottima la prima valutazione: obiettivi realistici e un piano preciso. Lo consiglio a chi riparte dopo una pausa.',
                'Sempre disponibile a spostare l’orario quando ho un imprevisto al lavoro. Allenamenti efficaci.',
            ],
            4 => [
                'Grande preparazione e tanta motivazione. Unico neo: a volte le sedute iniziano con qualche minuto di ritardo.',
                'Il programma funziona e c’è molta attenzione ai dettagli. Mi piacerebbe un po’ più di varietà negli esercizi.',
                'Buona esperienza, allenamenti seri e ben spiegati. Il prezzo è un po’ alto ma ne vale la pena.',
                'Ho imparato tanto sulla tecnica. Avrei preferito più indicazioni per i giorni senza seduta.',
            ],
            3 => [
                'Tanta competenza, ma le sedute mi sono sembrate un po’ ripetitive. Per chi cerca qualcosa di base va bene.',
                'Allenamento discreto. Non sempre facile trovare orari liberi la sera.',
            ],
        ];
        $replies = [
            5 => ['Grazie mille, è un piacere allenarti! Ci vediamo alla prossima seduta.', 'Grazie a te per l’impegno: i risultati sono tutti merito tuo!'],
            4 => ['Grazie del consiglio, ne terrò conto già dalla prossima volta.'],
            3 => ['Grazie per il feedback sincero, proverò a variare di più gli allenamenti.'],
        ];

        $randomizer = new Randomizer(new Mt19937(crc32($profile->slug)));
        $profile->reviews()->whereNull('booking_id')->delete();

        // All 5 stars, then one star less at a time (never below 3) until the sum gives the average.
        $ratings = array_fill(0, $count, 5);
        $missing = 5 * $count - (int) round($average * $count);

        for ($index = 0; $missing > 0; $index = ($index + 1) % $count) {
            if ($ratings[$index] > 3) {
                $ratings[$index]--;
                $missing--;
            }
        }

        foreach ($randomizer->shuffleArray($ratings) as $index => $rating) {
            $date = now()->subDays($index * 7 + $randomizer->getInt(0, 5))->subHours($randomizer->getInt(0, 10));
            $reply = $index % 3 === 1 ? $replies[$rating][$index % count($replies[$rating])] : null;

            $profile->reviews()->forceCreate([
                'client_id' => $clients[($index + $profile->id) % count($clients)]->id,
                'rating' => $rating,
                'text' => $texts[$rating][$randomizer->getInt(0, count($texts[$rating]) - 1)],
                'reply' => $reply,
                'replied_at' => $reply === null ? null : $date->addDay(),
                'created_at' => $date,
                'updated_at' => $date,
            ]);
        }

        $profile->refreshRating();
    }

    /** Giulia Rossi has the services of the profile design. */
    private function giuliaServices(): void
    {
        $profile = User::where('email', 'giulia-rossi@demo.miopersonal.test')->firstOrFail()->trainerProfile;

        if ($profile === null) {
            return;
        }

        $profile->services()->delete();

        // The first session on top, then one row for each duration (see SaveTrainerServices).
        $single = ['name' => 'Seduta singola', 'fixed_duration' => false, 'note' => 'in studio, a domicilio o al parco'];
        $online = ['name' => 'Seduta singola', 'fixed_duration' => false, 'note' => 'in videochiamata', 'online_only' => true];
        $services = [
            ['name' => Service::FIRST_SESSION_NAME, 'minutes' => 60, 'price_cents' => 3000, 'note' => 'test di partenza e obiettivi'],
            [...$single, 'minutes' => 60, 'price_cents' => 4500],
            [...$single, 'minutes' => 90, 'price_cents' => 6000],
            [...$single, 'minutes' => 120, 'price_cents' => 8000],
            [...$online, 'minutes' => 60, 'price_cents' => 3500],
            [...$online, 'minutes' => 90, 'price_cents' => 5000],
            [...$online, 'minutes' => 120, 'price_cents' => 6500],
            ['name' => 'Pacchetto 10 sedute', 'kind' => 'package', 'minutes' => 60, 'price_cents' => 40000, 'note' => 'prenoti qui la prima', 'package_sessions' => 10],
        ];

        foreach ($services as $index => $service) {
            $profile->services()->create([...$service, 'sort' => $index]);
        }

        // "da 45 €" on the cards, as in the design (the evaluation at 30 € is a one-off).
        $profile->forceFill(['price_from_cents' => 4500])->save();
    }

    /**
     * Giulia Rossi's area trainer, as in docs/design: the next sessions, a
     * request to answer, a package in progress, the last 7 days and a client
     * who hasn't booked for a while. Replaced at every run.
     *
     * @param  list<User>  $clients
     */
    private function giuliaBookings(array $clients): void
    {
        $profile = User::where('email', 'giulia-rossi@demo.miopersonal.test')->firstOrFail()->trainerProfile;

        if ($profile === null) {
            return;
        }

        $profile->bookings()->delete();
        $profile->clientPackages()->delete();

        $today = CarbonImmutable::now('Europe/Rome')->startOfDay();
        $single = $profile->services()->where('name', 'Seduta singola')->where('minutes', 60)->where('online_only', false)->firstOrFail();
        $package = $profile->services()->where('kind', 'package')->firstOrFail();
        [$anna, $paolo, $martina, $luca] = $clients;

        $book = function (User $client, CarbonImmutable $start, array $attributes = []) use ($profile, $single): Booking {
            $end = $start->addHour();

            return $profile->bookings()->forceCreate([
                'client_id' => $client->id,
                'service_id' => $single->id,
                'starts_at' => $start->utc(),
                'ends_at' => $end->utc(),
                'blocked_until' => $end->utc(),
                'service_name' => $single->name,
                'price_cents' => $single->price_cents,
                'place_label' => '',
                'status' => BookingStatus::Confirmed,
                'confirmed_at' => now(),
                ...$attributes,
            ]);
        };

        // Anna: "Pacchetto 10 sedute", one done, two booked.
        $annaPackage = $profile->clientPackages()->create([
            'client_id' => $anna->id,
            'service_id' => $package->id,
            'name' => $package->name,
            'price_cents' => $package->price_cents,
            'sessions_total' => 10,
            'minutes' => 60,
            'bought_at' => now()->subDays(5),
        ]);
        $inPackage = ['client_package_id' => $annaPackage->id, 'service_name' => $package->name, 'service_id' => $package->id];
        $book($anna, $today->subDays(3)->setTime(18, 0), [...$inPackage, 'price_cents' => $package->price_cents]);
        $book($anna, $today->addDay()->setTime(14, 0), [...$inPackage, 'price_cents' => 0]);
        $book($anna, $today->addDays(3)->setTime(18, 0), [...$inPackage, 'price_cents' => 0]);

        // Paolo: single sessions, one marked "Saltata".
        $book($paolo, $today->addDay()->setTime(13, 0));
        $book($paolo, $today->subDays(2)->setTime(19, 0));
        $book($paolo, $today->subDays(5)->setTime(19, 0), ['no_show_at' => now()->subDays(5)]);

        // Martina: a request waiting for the answer.
        $book($martina, $today->addDays(2)->setTime(18, 0), [
            'status' => BookingStatus::Pending,
            'confirmed_at' => null,
            'expires_at' => now()->addHours(20),
            'client_note' => 'Vorrei lavorare sulla postura, lavoro molte ore seduta.',
        ]);

        // Luca: nothing booked for three weeks ("Inattivi").
        $book($luca, $today->subDays(20)->setTime(18, 0));

        TrainerSlots::refresh($profile->load('workingHours'));
    }
}
