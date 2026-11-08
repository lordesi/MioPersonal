<?php

namespace Tests\Feature;

use App\Actions\Account\DeleteUser;
use App\Enums\GymAmenity;
use App\Models\GymAmenityDetail;
use App\Models\GymProfile;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** "Servizi" of the gym area: a description and a photo for each ticked service. */
class GymAmenitiesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(CatalogSeeder::class);
        Storage::fake('public');
    }

    private function gym(): GymProfile
    {
        return GymProfile::factory()->approved()->withAmenities([GymAmenity::Weights, GymAmenity::TurkishBath])->create();
    }

    private function photo(): UploadedFile
    {
        return UploadedFile::fake()->image('bagno.jpg', 1200, 800);
    }

    public function test_the_page_lists_the_ticked_services()
    {
        $gym = $this->gym();

        $this->actingAs($gym->user)
            ->get(route('gym.amenities'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('gym/amenities')
                ->has('amenities', 2)
                ->where('amenities.0.value', 'sala-pesi')
                ->where('amenities.1.label', 'Bagno turco')
                ->where('amenities.1.photoUrl', null)
            );
    }

    public function test_the_gym_saves_a_description_and_a_photo_shown_on_the_profile()
    {
        $gym = $this->gym();

        $this->actingAs($gym->user)
            ->post(route('gym.amenities.update', 'bagno-turco'), [
                'description' => '  Bagno turco a 45°, incluso in ogni abbonamento.  ',
                'photo' => $this->photo(),
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $detail = GymAmenityDetail::sole();
        $this->assertSame('Bagno turco a 45°, incluso in ogni abbonamento.', $detail->description);
        $this->assertNotNull($detail->photo_path);
        Storage::disk('public')->assertExists((string) $detail->photo_path);

        $this->get(route('gyms.show', $gym->slug))
            ->assertInertia(fn (Assert $page) => $page
                ->where('gym.amenities.1.value', 'bagno-turco')
                ->where('gym.amenities.1.description', 'Bagno turco a 45°, incluso in ogni abbonamento.')
                ->where('gym.amenities.1.photoUrl', $detail->photoUrl())
                ->where('gym.amenities.0.description', null)
            );
    }

    public function test_a_new_photo_replaces_the_old_one_and_can_be_taken_off()
    {
        $gym = $this->gym();
        $this->actingAs($gym->user)->post(route('gym.amenities.update', 'bagno-turco'), ['photo' => $this->photo()]);
        $old = (string) GymAmenityDetail::sole()->photo_path;

        $this->actingAs($gym->user)->post(route('gym.amenities.update', 'bagno-turco'), ['description' => 'Nuovo', 'photo' => $this->photo()]);
        $new = (string) GymAmenityDetail::sole()->photo_path;

        $this->assertNotSame($old, $new);
        Storage::disk('public')->assertMissing($old);

        $this->actingAs($gym->user)->delete(route('gym.amenities.photo.destroy', 'bagno-turco'))->assertRedirect();

        Storage::disk('public')->assertMissing($new);
        $this->assertNull(GymAmenityDetail::sole()->photo_path);
        $this->assertSame('Nuovo', GymAmenityDetail::sole()->description);
    }

    public function test_an_empty_card_leaves_no_row()
    {
        $gym = $this->gym();
        $this->actingAs($gym->user)->post(route('gym.amenities.update', 'bagno-turco'), ['description' => 'Testo']);
        $this->actingAs($gym->user)->post(route('gym.amenities.update', 'bagno-turco'), ['description' => '']);

        $this->assertSame(0, GymAmenityDetail::count());
    }

    public function test_only_ticked_services_and_valid_files()
    {
        $gym = $this->gym();

        // Not ticked, and not a service at all.
        $this->actingAs($gym->user)->post(route('gym.amenities.update', 'piscina'), ['description' => 'x'])->assertNotFound();
        $this->actingAs($gym->user)->post('/area-palestra/servizi/jacuzzi', ['description' => 'x'])->assertNotFound();

        $this->actingAs($gym->user)
            ->post(route('gym.amenities.update', 'bagno-turco'), [
                'description' => str_repeat('a', GymAmenityDetail::DESCRIPTION_MAX + 1),
                'photo' => UploadedFile::fake()->image('piccola.jpg', 300, 200),
            ])
            ->assertSessionHasErrors(['description', 'photo']);

        $this->assertSame(0, GymAmenityDetail::count());
    }

    public function test_a_service_taken_off_the_profile_takes_its_details_with_it()
    {
        $gym = $this->gym();
        $this->actingAs($gym->user)->post(route('gym.amenities.update', 'bagno-turco'), ['description' => 'Caldo', 'photo' => $this->photo()]);
        $path = (string) GymAmenityDetail::sole()->photo_path;
        // "Modifica profilo" needs a cover already there.
        $gym->photos()->create(['path' => 'gyms/cover.jpg', 'is_cover' => true]);

        $this->actingAs($gym->user)
            ->put(route('gym.profile.update'), [
                'name' => $gym->name,
                'city' => $gym->city->slug,
                'address' => 'Via Roma 12',
                'description' => str_repeat('Una palestra luminosa con sala pesi e corsi. ', 3),
                'amenities' => ['sala-pesi'],
                'hours' => [],
            ])
            ->assertSessionHasNoErrors();

        $this->assertSame(0, GymAmenityDetail::count());
        Storage::disk('public')->assertMissing($path);
    }

    public function test_the_photos_go_with_the_account()
    {
        $gym = $this->gym();
        $this->actingAs($gym->user)->post(route('gym.amenities.update', 'bagno-turco'), ['photo' => $this->photo()]);
        $path = (string) GymAmenityDetail::sole()->photo_path;

        app(DeleteUser::class)->handle($gym->user);

        Storage::disk('public')->assertMissing($path);
        $this->assertSame(0, GymAmenityDetail::count());
    }
}
