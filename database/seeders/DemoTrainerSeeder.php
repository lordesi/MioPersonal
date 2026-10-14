<?php

namespace Database\Seeders;

use App\Actions\Trainer\SaveTrainerProfile;
use App\Enums\TrainerProfileStatus;
use App\Enums\TrainerReviewDecision;
use App\Enums\UserRole;
use App\Models\TrainerProfile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Example trainers for local development only (DatabaseSeeder calls it when
 * APP_ENV=local): the 9 trainers of the search design, approved, and 5
 * profiles waiting in "Admin · Verifica". It can run again: it updates them.
 * Emails are …@demo.miopersonal.test, the password is "password".
 *
 * Ratings are written straight into the computed fields until the real
 * reviews exist (step 6 of docs/database/analisi.md).
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
        // name, city, other cities, disciplines, rating, reviews, price in cents, places, times, headline
        $approved = [
            ['Giulia Rossi', 'milano', ['monza'], ['functional', 'pilates', 'postura'], 4.9, 23, 4500, ['studio', 'home', 'park', 'online'], [], 'Functional training e Pilates'],
            ['Marco Bianchi', 'milano', [], ['pesi-e-bodybuilding', 'preparazione-atletica'], 4.8, 31, 5000, ['studio'], ['lunch', 'afternoon', 'evening'], 'Forza e ipertrofia, anche per principianti'],
            ['Sara Colombo', null, [], ['yoga', 'pilates'], 5.0, 12, 3000, ['online'], ['early-morning', 'lunch', 'evening'], 'Yoga e Pilates online'],
            ['Luca Ferrari', 'torino', [], ['crossfit', 'functional'], 4.7, 18, 4500, ['studio', 'park'], ['early-morning', 'evening'], 'Crossfit e allenamento funzionale'],
            ['Elena Ricci', 'monza', ['milano'], ['pilates', 'yoga'], null, 0, 4000, ['studio', 'home', 'online'], ['morning', 'afternoon'], 'Pilates e Yoga per tutti i livelli'],
            ['Davide Greco', 'bergamo', [], ['boxe', 'functional'], 4.9, 9, 3500, ['studio', 'home'], ['afternoon', 'evening', 'weekend'], 'Boxe e preparazione fisica'],
            ['Chiara Galli', 'roma', [], ['yoga'], 4.8, 27, 3800, ['park', 'online'], ['morning', 'weekend'], 'Yoga all’aperto e online'],
            ['Andrea Conti', 'milano', [], ['calisthenics', 'pesi-e-bodybuilding'], 4.6, 14, 4000, ['home', 'park', 'online'], ['early-morning', 'evening', 'weekend'], 'Calisthenics a corpo libero'],
            ['Francesca Marino', 'roma', [], ['preparazione-atletica', 'pesi-e-bodybuilding'], null, 0, 5500, ['studio', 'home'], ['early-morning', 'lunch'], 'Preparazione atletica per gare amatoriali'],
        ];

        foreach ($approved as [$name, $city, $otherCities, $disciplines, $rating, $reviews, $price, $places, $times, $headline]) {
            $profile = $this->trainer($saver, $name, $city, $otherCities, $disciplines, $price, $places, $times, $headline);
            $profile->forceFill([
                'status' => TrainerProfileStatus::Approved,
                'status_changed_at' => now()->subMonths(2),
                'approved_at' => now()->subMonths(2),
                'rating_count' => $reviews,
                'rating_sum' => $rating === null ? 0 : (int) round($rating * $reviews),
            ])->save();
        }

        $this->giuliaServices();

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
     */
    private function trainer(SaveTrainerProfile $saver, string $name, ?string $city, array $otherCities, array $disciplines, int $price, array $places, array $times, string $headline, ?string $bio = null): TrainerProfile
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
            'places' => $places,
            'studios' => in_array('studio', $places, true) ? [['name' => "Studio {$lastName}", 'address' => 'Via Roma 10']] : [],
            'city' => $city,
            'other_cities' => $otherCities,
            // "Servizi e prezzi": the hourly price and a package of 10 one-hour sessions.
            'hourly_price_cents' => $price,
            'packages' => [['sessions' => 10, 'minutes' => 60, 'price_cents' => $price * 9]],
            'hours' => $this->hours($times),
            'notice_hours' => 12,
            'booking_window_days' => 60,
            'break_minutes' => 15,
            'max_sessions_per_day' => 6,
            'free_cancellation_hours' => 24,
            'session_minutes' => [60, 90, 120],
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

    /** Giulia Rossi has the services of the profile design. */
    private function giuliaServices(): void
    {
        $profile = User::where('email', 'giulia-rossi@demo.miopersonal.test')->firstOrFail()->trainerProfile;

        if ($profile === null) {
            return;
        }

        $profile->services()->delete();

        $services = [
            ['name' => 'Seduta singola', 'minutes' => 60, 'price_cents' => 4500, 'price_per_hour' => true, 'fixed_duration' => false, 'note' => 'in studio, a domicilio o al parco'],
            ['name' => 'Seduta online', 'minutes' => 60, 'price_cents' => 3500, 'price_per_hour' => true, 'fixed_duration' => false, 'note' => 'in videochiamata', 'online_only' => true],
            ['name' => 'Valutazione iniziale', 'minutes' => 60, 'price_cents' => 3000, 'note' => 'test di partenza e obiettivi'],
            ['name' => 'Pacchetto 10 sedute', 'kind' => 'package', 'minutes' => 60, 'price_cents' => 40000, 'note' => 'prenoti qui la prima', 'package_sessions' => 10],
        ];

        foreach ($services as $index => $service) {
            $profile->services()->create([...$service, 'sort' => $index]);
        }

        // "da 45 €" on the cards, as in the design (the evaluation at 30 € is a one-off).
        $profile->forceFill(['price_from_cents' => 4500])->save();
    }
}
