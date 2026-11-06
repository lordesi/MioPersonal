<?php

namespace Database\Seeders;

use App\Actions\Gym\GymLinks;
use App\Enums\GymAmenity;
use App\Enums\GymLinkSide;
use App\Enums\GymPlanPeriod;
use App\Enums\TrainerProfileStatus;
use App\Enums\UserRole;
use App\Models\City;
use App\Models\GymProfile;
use App\Models\GymTrainerLink;
use App\Models\TrainerProfile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Example gyms for local development only (DatabaseSeeder calls it when
 * APP_ENV=local, after DemoTrainerSeeder): 4 approved gyms with hours, plans
 * and a promotion, linked to some demo trainers, and 1 waiting in "Admin ·
 * Verifica palestre". It can run again: it updates them. Emails are
 * …@demo.miopersonal.test, the password is "password". No photos: the pages
 * show the placeholder.
 */
class DemoGymSeeder extends Seeder
{
    public function run(GymLinks $links): void
    {
        // name, city, address, amenities, monthly price, trainers (emails without the domain)
        $gyms = [
            ['FitLab Centro', 'milano', 'Via Torino 40', [GymAmenity::Weights, GymAmenity::Cardio, GymAmenity::Classes, GymAmenity::Sauna, GymAmenity::Lockers], 4900, ['giulia-rossi', 'marco-bianchi']],
            ['Acqua Club', 'milano', 'Viale Monza 120', [GymAmenity::Pool, GymAmenity::Spa, GymAmenity::TurkishBath, GymAmenity::Cardio, GymAmenity::Parking], 7900, ['andrea-conti']],
            ['Iron Box Torino', 'torino', 'Corso Francia 15', [GymAmenity::Crossfit, GymAmenity::Functional, GymAmenity::Weights, GymAmenity::Open24h], 5500, ['luca-ferrari']],
            ['Studio Zen Roma', 'roma', 'Via del Corso 200', [GymAmenity::YogaPilates, GymAmenity::Classes, GymAmenity::Lockers, GymAmenity::Wifi], 3900, ['chiara-galli']],
        ];

        foreach ($gyms as [$name, $city, $address, $amenities, $price, $trainers]) {
            $gym = $this->gym($name, $city, $address, $amenities, TrainerProfileStatus::Approved);
            $this->plans($gym, $price);

            foreach ($trainers as $slug) {
                $trainer = TrainerProfile::query()
                    ->whereHas('user', fn ($user) => $user->where('email', "{$slug}@demo.miopersonal.test"))
                    ->where('status', TrainerProfileStatus::Approved)
                    ->first();

                if ($trainer !== null && ! GymTrainerLink::where('gym_profile_id', $gym->id)->where('trainer_profile_id', $trainer->id)->exists()) {
                    $link = $links->invite($gym, $trainer);
                    $links->accept($link, GymLinkSide::Trainer);
                }
            }
        }

        $this->gym('Palestra Nuova Bergamo', 'bergamo', 'Via XX Settembre 3', [GymAmenity::Weights, GymAmenity::Cardio], TrainerProfileStatus::Review);
    }

    /** @param  list<GymAmenity>  $amenities */
    private function gym(string $name, string $city, string $address, array $amenities, TrainerProfileStatus $status): GymProfile
    {
        $user = User::firstOrNew(['email' => Str::slug($name).'@demo.miopersonal.test']);
        $user->forceFill([
            'first_name' => 'Referente',
            'last_name' => $name,
            'password' => 'password',
            'role' => UserRole::Gym,
            'email_verified_at' => now(),
            'terms_accepted_at' => now(),
        ])->save();

        $cityModel = City::where('slug', $city)->firstOrFail();
        $gym = $user->gymProfile ?? new GymProfile;
        $gym->user_id = $user->id;
        $gym->fill([
            'name' => $name,
            'description' => "{$name} è una palestra di {$cityModel->name} con spazi ampi e luminosi, attrezzature moderne e personale qualificato.\n\nÈ adatta a chi inizia e a chi si allena da anni: chiedi una prova gratuita alla reception.",
            'city_id' => $cityModel->id,
            'address' => $address,
            'postal_code' => null,
            'amenities' => array_map(fn (GymAmenity $amenity) => $amenity->value, $amenities),
            'phone' => '02 1234567',
            'email' => 'info@'.Str::slug($name).'.example',
        ]);
        $gym->slug ??= GymProfile::uniqueSlug($name, $cityModel->name);
        $gym->forceFill([
            'status' => $status,
            'status_changed_at' => now(),
            'approved_at' => $status === TrainerProfileStatus::Approved ? now() : null,
        ])->save();

        $gym->openingHours()->delete();
        foreach (range(1, 5) as $weekday) {
            $gym->openingHours()->create(['weekday' => $weekday, 'opens_at' => '07:00', 'closes_at' => '22:30']);
        }
        $gym->openingHours()->create(['weekday' => 6, 'opens_at' => '09:00', 'closes_at' => '19:00']);

        return $gym;
    }

    private function plans(GymProfile $gym, int $monthly): void
    {
        $gym->promotions()->delete();
        $gym->plans()->delete();

        $gym->plans()->create(['name' => 'Mensile Open', 'period' => GymPlanPeriod::Monthly, 'price_cents' => $monthly, 'features' => ['Accesso illimitato', 'Scheda di allenamento'], 'sort' => 0]);
        $yearly = $gym->plans()->create(['name' => 'Annuale', 'period' => GymPlanPeriod::Yearly, 'price_cents' => $monthly * 10, 'features' => ['Due mesi gratis', 'Accesso illimitato'], 'sort' => 1]);
        $gym->plans()->create(['name' => '10 ingressi', 'period' => GymPlanPeriod::Entries, 'entries_count' => 10, 'price_cents' => $monthly * 2, 'sort' => 2]);
        $gym->refreshMonthlyFrom();

        $gym->promotions()->create([
            'gym_plan_id' => $yearly->id,
            'title' => 'Iscrizione gratuita',
            'description' => 'Per chi si iscrive questo mese con l’annuale.',
            'discount_percent' => 15,
            'starts_on' => now()->startOfMonth()->toDateString(),
            'ends_on' => now()->endOfMonth()->toDateString(),
        ]);
    }
}
