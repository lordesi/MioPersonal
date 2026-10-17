<?php

namespace Tests\Feature;

use App\Enums\PlaceType;
use App\Models\City;
use App\Models\TrainerPhoto;
use App\Models\TrainerPlace;
use App\Models\TrainerProfile;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** The studios on the "Zona" map: their address becomes coordinates with Nominatim (faked). */
class GeocodeTrainerPlaceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(CatalogSeeder::class);
        Storage::fake(TrainerPhoto::DISK);
        Storage::fake('local');
    }

    private function approvedTrainer(): TrainerProfile
    {
        $profile = TrainerProfile::factory()->approved()->bookable()->withDisciplines(['yoga'])->create();
        $path = UploadedFile::fake()->image('ritratto.jpg', 600, 600)->store("trainers/{$profile->id}", TrainerPhoto::DISK);
        $profile->photos()->create(['path' => $path, 'caption' => 'Ritratto', 'is_portrait' => true]);

        return $profile;
    }

    /** "Modifica profilo" with one studio in Milano. */
    private function saveStudio(TrainerProfile $profile, string $address = 'Via Solferino 3'): void
    {
        $this->actingAs($profile->user)
            ->put(route('trainer.profile.update'), [
                'headline' => 'Pilates e postura',
                'bio' => str_repeat('Alleno persone che vogliono muoversi meglio. ', 5),
                'experience' => '5to10',
                'disciplines' => ['pilates'],
                'places' => ['studio'],
                'studios' => [['name' => 'Studio Brera', 'address' => $address]],
                'city' => 'milano',
                'other_cities' => [],
                'certifications' => [],
            ])
            ->assertSessionHasNoErrors();
    }

    /**
     * A Nominatim result, in the town $town.
     *
     * @return list<array{lat: string, lon: string, address: array<string, string>}>
     */
    private function found(string $lat, string $lon, string $town = 'Milano'): array
    {
        return [['lat' => $lat, 'lon' => $lon, 'address' => ['city' => $town]]];
    }

    private function studio(TrainerProfile $profile): TrainerPlace
    {
        return $profile->places()->where('type', PlaceType::Studio)->sole();
    }

    public function test_a_new_studio_is_found_on_the_map()
    {
        $this->nominatimResults = $this->found('45.4721', '9.1873');
        $profile = $this->approvedTrainer();

        $this->saveStudio($profile);

        $studio = $this->studio($profile);
        $this->assertSame(45.4721, $studio->lat);
        $this->assertSame(9.1873, $studio->lng);
        Http::assertSent(fn ($request) => $request['q'] === 'Via Solferino 3, Milano'
            && (string) $request['bounded'] === '1'
            && str_starts_with($request->header('User-Agent')[0], config('app.name')));
    }

    public function test_an_address_in_another_town_is_not_used()
    {
        // The search box around Milano also holds Cormano, with its own "Via Roma".
        $this->nominatimResults = $this->found('45.5435', '9.1708', 'Cormano');
        $profile = $this->approvedTrainer();

        $this->saveStudio($profile, 'Via Roma 10');

        $this->assertNull($this->studio($profile)->lat);
    }

    public function test_the_same_address_keeps_its_coordinates_without_asking_again()
    {
        $this->nominatimResults = $this->found('45.4721', '9.1873');
        $profile = $this->approvedTrainer();
        $this->saveStudio($profile);

        $this->nominatimResults = $this->found('41.9', '12.5');
        $this->saveStudio($profile);

        $this->assertSame(45.4721, $this->studio($profile)->lat);
        Http::assertSentCount(1);
    }

    public function test_a_new_address_is_found_again()
    {
        $this->nominatimResults = $this->found('45.4721', '9.1873');
        $profile = $this->approvedTrainer();
        $this->saveStudio($profile);

        $this->nominatimResults = $this->found('45.4642', '9.19');
        $this->saveStudio($profile, 'Piazza del Duomo 1');

        $this->assertSame(45.4642, $this->studio($profile)->lat);
    }

    public function test_the_map_is_on_the_studio_when_it_is_found()
    {
        $this->nominatimResults = $this->found('45.4721', '9.1873');
        $profile = $this->approvedTrainer();
        $this->saveStudio($profile);

        $this->get(route('trainers.show', $profile->slug))
            ->assertInertia(fn (Assert $page) => $page
                ->where('trainer.areaLabel', 'Studio Brera')
                ->where('trainer.areaCenter', ['lat' => 45.4721, 'lng' => 9.1873])
                ->where('trainer.areaRadius', 300)
            );
    }

    public function test_an_address_not_found_leaves_the_map_on_the_city()
    {
        $profile = $this->approvedTrainer();
        $this->saveStudio($profile);
        $milano = City::where('slug', 'milano')->sole();

        $this->assertNull($this->studio($profile)->lat);
        $this->get(route('trainers.show', $profile->slug))
            ->assertInertia(fn (Assert $page) => $page
                ->where('trainer.areaLabel', 'Milano')
                ->where('trainer.areaCenter', ['lat' => $milano->lat, 'lng' => $milano->lng])
                ->where('trainer.areaRadius', 3000)
            );
    }

    public function test_the_command_finds_the_studios_without_coordinates()
    {
        $profile = $this->approvedTrainer();
        $this->saveStudio($profile);
        $this->nominatimResults = $this->found('45.4721', '9.1873');

        $this->artisan('places:geocode')
            ->expectsOutput('1 of 1 studios found on the map.')
            ->assertSuccessful();

        $this->assertSame(45.4721, $this->studio($profile)->lat);
    }
}
