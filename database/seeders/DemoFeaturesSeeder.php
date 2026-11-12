<?php

namespace Database\Seeders;

use App\Actions\Bookings\GenerateSeries;
use App\Actions\GroupSessions\GroupSessionPlaces;
use App\Actions\Trainer\LinkClient;
use App\Actions\Waitlist\Waitlist;
use App\Enums\BookingStatus;
use App\Enums\CourseLevel;
use App\Enums\GroupSessionPlace;
use App\Enums\GroupSessionType;
use App\Models\BookingSeries;
use App\Models\GroupSession;
use App\Models\GymProfile;
use App\Models\TrainerClient;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Support\TrainerSlots;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Everything the newer features need to be tried by hand: the home shelves
 * (in tendenza, nuovi), gym courses, events (one open, one sold
 * out with someone in the waitlist, an online one, a gym open day), a "seduta
 * fissa", the client records of Giulia Rossi and weeks of past sessions for
 * the journey in "Admin · Statistiche".
 *
 * Run it after DemoTrainerSeeder and DemoGymSeeder (DatabaseSeeder does it).
 * It only adds: whatever already exists (a course, an event, a record) is
 * left as it is, so it can run again. All passwords are "password".
 */
class DemoFeaturesSeeder extends Seeder
{
    private const TZ = 'Europe/Rome';

    public function run(GroupSessionPlaces $places, Waitlist $waitlist, GenerateSeries $series, LinkClient $linker): void
    {
        $clients = User::query()
            ->where('email', 'like', '%@demo.miopersonal.test')
            ->where('role', 'client')
            ->orderBy('id')
            ->get();

        if ($clients->count() < 6 || ! $this->trainer('giulia-rossi')) {
            $this->command->warn('Run DemoTrainerSeeder first.');

            return;
        }

        $this->shelves();
        $this->courses();
        $this->events($places, $waitlist, $clients);
        $this->giulia($series, $linker, $clients);
    }

    private function trainer(string $slug): ?TrainerProfile
    {
        return TrainerProfile::query()
            ->whereHas('user', fn ($user) => $user->where('email', "{$slug}@demo.miopersonal.test"))
            ->first();
    }

    private function gym(string $name): ?GymProfile
    {
        return GymProfile::query()->where('name', $name)->first();
    }

    /** Visits in the last 14 days (in tendenza) and recent approvals (nuovi). */
    private function shelves(): void
    {
        // trainer => visits over the last 14 days
        $visits = ['marco-bianchi' => 140, 'giulia-rossi' => 96, 'luca-ferrari' => 64, 'chiara-galli' => 48, 'andrea-conti' => 30];

        foreach ($visits as $slug => $total) {
            $profile = $this->trainer($slug);

            if ($profile === null) {
                continue;
            }

            foreach (range(0, 13) as $daysAgo) {
                // More visits recently, never zero. A day that already has a count is left alone.
                DB::table('trainer_profile_views')->insertOrIgnore([
                    'trainer_profile_id' => $profile->id,
                    'day' => CarbonImmutable::now(self::TZ)->subDays($daysAgo)->toDateString(),
                    'views' => max(1, (int) round($total / 14 * (1.6 - $daysAgo / 14 * 1.2))),
                ]);
            }
        }

        // "Novità": approved in the last month (only if they are older now).
        foreach (['elena-ricci' => 3, 'davide-greco' => 9, 'francesca-marino' => 15] as $slug => $daysAgo) {
            $profile = $this->trainer($slug);

            if ($profile !== null && $profile->approved_at?->lt(now()->subDays(30))) {
                $profile->forceFill(['approved_at' => now()->subDays($daysAgo)])->save();
            }
        }
    }

    private function courses(): void
    {
        // gym => [name, description, level, instructor trainer slug|null, instructor name|null, (was bookable, unused), [[weekday, from, to, room, capacity]]]
        $plan = [
            'FitLab Centro' => [
                ['Pilates Mat', 'Lavoro a corpo libero su tappetino per postura, core e mobilità.', CourseLevel::All, 'giulia-rossi', null, true, [[1, '19:00', '20:00', 'Sala 2', 12], [3, '19:00', '20:00', 'Sala 2', 12]]],
                ['Functional Group', 'Circuiti a gruppi per forza e resistenza.', CourseLevel::Intermediate, 'marco-bianchi', null, true, [[2, '18:30', '19:30', 'Sala 1', 10], [4, '18:30', '19:30', 'Sala 1', 10]]],
                ['Stretching e mobilità', 'Mezz’ora per sciogliersi dopo una giornata alla scrivania.', CourseLevel::Beginner, null, 'Marta Pellegrini', false, [[5, '13:00', '13:45', 'Sala 2', null]]],
            ],
            'Acqua Club' => [
                ['Acquagym', 'Allenamento in acqua a basso impatto per tutte le età.', CourseLevel::All, null, 'Paola Serra', false, [[1, '10:00', '10:45', 'Vasca grande', 20], [3, '10:00', '10:45', 'Vasca grande', 20], [5, '10:00', '10:45', 'Vasca grande', 20]]],
            ],
            'Iron Box Torino' => [
                ['WOD Crossfit', 'Allenamento del giorno: riscaldamento, tecnica e metcon.', CourseLevel::Advanced, 'luca-ferrari', null, true, array_map(fn (int $day) => [$day, '18:00', '19:00', 'Box', 14], [1, 2, 3, 4, 5])],
            ],
            'Studio Zen Roma' => [
                ['Yoga Vinyasa', 'Sequenze dinamiche sul respiro.', CourseLevel::Intermediate, 'chiara-galli', null, true, [[2, '20:00', '21:00', 'Sala Zen', 12], [4, '20:00', '21:00', 'Sala Zen', 12]]],
                ['Hatha Yoga', 'Posizioni tenute e respirazione, ritmo lento.', CourseLevel::Beginner, null, 'Irene Costa', false, [[6, '10:00', '11:15', 'Sala Zen', 12]]],
            ],
        ];

        foreach ($plan as $gymName => $courses) {
            $gym = $this->gym($gymName);

            if ($gym === null) {
                continue;
            }

            foreach ($courses as $sort => [$name, $description, $level, $trainer, $instructor, , $lessons]) {
                // A course the gym already has with this name stays as it is.
                if ($gym->courses()->where('name', $name)->exists()) {
                    continue;
                }

                $course = $gym->courses()->create([
                    'name' => $name,
                    'description' => $description,
                    'level' => $level,
                    'instructor_trainer_id' => $trainer ? $this->trainer($trainer)?->id : null,
                    'instructor_name' => $instructor,
                    'is_active' => true,
                    'sort' => $sort,
                ]);

                foreach ($lessons as [$weekday, $from, $to, $room, $capacity]) {
                    $course->lessons()->create([
                        'weekday' => $weekday,
                        'starts_at' => $from,
                        'ends_at' => $to,
                        'room' => $room,
                        'capacity' => $capacity,
                    ]);
                }
            }
        }
    }

    /** @param  Collection<int, User>  $clients */
    private function events(GroupSessionPlaces $places, Waitlist $waitlist, Collection $clients): void
    {
        $when = fn (int $days, int $hour) => CarbonImmutable::now(self::TZ)->addDays($days)->setTime($hour, 0);

        // Null when an event with this title exists already: it is not touched.
        $make = function (TrainerProfile|GymProfile $owner, string $title, GroupSessionType $type, CarbonImmutable $start, int $minutes, int $capacity, array $extra = []): ?GroupSession {
            if (GroupSession::where('title', $title)->exists()) {
                return null;
            }

            return GroupSession::factory()->by($owner)->startingAt($start, $minutes)->create([
                'title' => $title,
                'slug' => Str::limit(Str::slug($title), 100, '').'-'.Str::lower(Str::random(6)),
                'type' => $type,
                'capacity' => $capacity,
                ...$extra,
            ]);
        };

        $giulia = $this->trainer('giulia-rossi');
        $marco = $this->trainer('marco-bianchi');
        $chiara = $this->trainer('chiara-galli');
        $fitlab = $this->gym('FitLab Centro');

        // Open, with some people already in.
        $open = $make($giulia, 'Postura e schiena: workshop gratuito', GroupSessionType::Workshop, $when(5, 10), 90, 20, [
            'description' => 'Un’ora e mezza per capire come si sta alla scrivania e come si scioglie la schiena. Porta un tappetino.',
            'address' => 'Parco Sempione, ingresso Arco della Pace',
        ]);
        foreach ($open ? $clients->take(6) : [] as $client) {
            $places->register($open, $client);
        }

        // Sold out, with a person waiting for a place.
        $full = $make($marco, 'Allenamento di gruppo al parco', GroupSessionType::Training, $when(3, 19), 60, 2, [
            'description' => 'Due posti soltanto: circuito di forza all’aperto. Prova la lista d’attesa.',
            'address' => 'Giardini Montanelli',
            'price_cents' => 1000,
        ]);
        if ($full !== null) {
            $places->register($full, $clients[0]);
            $places->register($full, $clients[1]);
            $waitlist->joinEvent($clients[2], $full);
        }

        // Online.
        $make($chiara, 'Yoga al tramonto (online)', GroupSessionType::Training, $when(2, 20), 60, 30, [
            'description' => 'Pratica guidata in diretta: serve solo un tappetino.',
            'place' => GroupSessionPlace::Online,
            'address' => null,
        ]);

        // A gym open day.
        $day = $fitlab === null ? null : $make($fitlab, 'Open day FitLab Centro', GroupSessionType::OpenDay, $when(10, 10), 240, 50, [
            'description' => 'Porte aperte: prova gratuita delle sale, dei corsi e una consulenza con i nostri trainer.',
            'place' => GroupSessionPlace::Gym,
            'gym_profile_id' => $fitlab->id,
            'address' => null,
        ]);
        foreach ($day ? $clients->slice(3, 4) : [] as $client) {
            $places->register($day, $client);
        }
    }

    /**
     * Client records, a "seduta fissa" and weeks of past sessions.
     *
     * @param  Collection<int, User>  $clients  the demo clients
     */
    private function giulia(GenerateSeries $generator, LinkClient $linker, Collection $clients): void
    {
        $profile = $this->trainer('giulia-rossi');
        $single = $profile->services()->where('name', 'Seduta singola')->where('minutes', 60)->where('online_only', false)->first();

        if ($single === null) {
            return;
        }

        // Weeks of past sessions: the journey of the admin statistics.
        $today = CarbonImmutable::now(self::TZ)->startOfDay();

        foreach (range(1, 8) as $weeksAgo) {
            foreach (range(0, $weeksAgo % 3) as $i) {
                $start = $today->subWeeks($weeksAgo)->addDays($i)->setTime(17 + $i, 0);

                if ($profile->bookings()->where('starts_at', $start->utc())->exists()) {
                    continue;
                }

                $profile->bookings()->forceCreate([
                    'client_id' => $clients[($weeksAgo + $i) % 6]->id,
                    'service_id' => $single->id,
                    'starts_at' => $start->utc(),
                    'ends_at' => $start->addHour()->utc(),
                    'blocked_until' => $start->addHour()->utc(),
                    'service_name' => $single->name,
                    'price_cents' => $single->price_cents,
                    'place_label' => '',
                    'status' => BookingStatus::Confirmed,
                    'confirmed_at' => $start->subDays(2)->utc(),
                    'created_at' => $start->subDays(3)->utc(),
                ]);
            }
        }

        // Records of her clients: the ones with sessions, plus one added by hand.
        $linker->backfill($profile);

        $anna = TrainerClient::where('trainer_profile_id', $profile->id)
            ->whereHas('user', fn ($user) => $user->where('email', 'like', 'anna-%'))
            ->first();

        // What the trainer already wrote about Anna stays.
        if ($anna !== null && $anna->goal === null && $anna->private_notes === null) {
            $anna->update(['goal' => 'Perdere 6 kg entro l’estate', 'private_notes' => 'Ginocchio sinistro delicato: niente salti. Preferisce la sera.']);
        }
        if ($anna !== null && $anna->payments()->doesntExist()) {
            $anna->payments()->create(['amount_cents' => 40000, 'paid_on' => now()->subDays(5)->toDateString(), 'note' => 'Pacchetto 10 sedute, contanti']);
        }

        if (! TrainerClient::where('trainer_profile_id', $profile->id)->where('name', 'Roberta Neri')->exists()) {
            $roberta = $profile->clientRecords()->create([
                'name' => 'Roberta Neri',
                'phone' => '+39 333 000 1122',
                'goal' => 'Tornare ad allenarsi dopo la gravidanza',
                'private_notes' => 'Non ancora iscritta al sito: invitarla col link personale.',
            ]);
            $roberta->payments()->create(['amount_cents' => 4500, 'paid_on' => now()->subDays(2)->toDateString(), 'note' => 'Prima seduta']);
        }

        // "Seduta fissa": Silvia, every week at the first hour that is really free in a couple of days.
        if (BookingSeries::where('trainer_profile_id', $profile->id)->exists()) {
            return;
        }

        $silvia = $clients->first(fn (User $user) => str_starts_with($user->email, 'silvia-'));
        $first = collect(TrainerSlots::days($profile->fresh(), 14, now()))
            ->slice(2)
            ->flatMap(fn (array $day) => $day['slots'])
            ->first(fn (array $slot) => $slot['maxMinutes'] >= 60);

        if ($silvia === null || $first === null) {
            return;
        }

        $first = CarbonImmutable::parse($first['start'])->setTimezone(self::TZ);

        $generator->handle(BookingSeries::create([
            'trainer_profile_id' => $profile->id,
            'client_id' => $silvia->id,
            'service_id' => $single->id,
            'service_name' => $single->name,
            'price_cents' => $single->price_cents,
            'minutes' => 60,
            'place_label' => '',
            'weekday' => $first->dayOfWeekIso,
            'start_time' => $first->format('H:i'),
            'starts_on' => $today->toDateString(),
        ]));
    }
}
