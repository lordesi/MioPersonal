<?php

namespace Tests\Feature;

use App\Actions\Account\DeleteUser;
use App\Enums\TrainerProfileStatus;
use App\Enums\TrainerReviewDecision;
use App\Enums\UserRole;
use App\Models\City;
use App\Models\GymProfile;
use App\Models\User;
use App\Notifications\GymProfileDecided;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** "Registra la tua palestra", the gym area and "Admin · Verifica palestre". */
class GymRegistrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(CatalogSeeder::class);
        Storage::fake('public');
        Notification::fake();
    }

    /**
     * Steps 2–5 as the page sends them (toGymPayload in draft.ts).
     *
     * @param  array<string, mixed>  $changes
     * @return array<string, mixed>
     */
    private function profile(array $changes = []): array
    {
        return [
            'name' => 'FitLab Centro',
            'city' => 'milano',
            'address' => 'Via Roma 12',
            'postal_code' => '20121',
            'description' => str_repeat('Una palestra luminosa con sala pesi e corsi. ', 3),
            'amenities' => ['sala-pesi', 'corsi', 'sauna'],
            // Monday 6:30–13 and 15–22:30, Sunday open all day.
            'hours' => [
                0 => [['opens' => '06:30', 'closes' => '13:00'], ['opens' => '15:00', 'closes' => '22:30']],
                6 => [['opens' => '00:00', 'closes' => '24:00']],
            ],
            'opening_notes' => 'Chiusa ad agosto',
            'cover' => UploadedFile::fake()->image('copertina.jpg', 1200, 800),
            'gallery' => [UploadedFile::fake()->image('sala.jpg', 1200, 800)],
            'contact_phone' => '02 1234567',
            'contact_email' => 'Info@FitLab.it',
            'website' => 'www.fitlab.it',
            'instagram' => '@fitlab.milano',
            ...$changes,
        ];
    }

    /** @return array<string, mixed> */
    private function account(): array
    {
        return [
            'first_name' => 'Paola',
            'last_name' => 'Verdi',
            'email' => 'paola@fitlab.it',
            'phone' => '347 521 8846',
            'password' => 'Password-sicura-1',
            'terms' => true,
        ];
    }

    public function test_a_guest_registers_a_gym_that_waits_for_the_team()
    {
        $this->post(route('gym.register.store'), [...$this->account(), ...$this->profile()])
            ->assertRedirect(route('gym.register'))
            ->assertSessionHas('status', 'gym-registered');

        $user = User::where('email', 'paola@fitlab.it')->firstOrFail();
        $this->assertSame(UserRole::Gym, $user->role);
        $this->assertAuthenticatedAs($user);

        $gym = $user->gymProfile;
        $this->assertSame(TrainerProfileStatus::Review, $gym->status);
        $this->assertSame('fitlab-centro-milano', $gym->slug);
        $this->assertSame(['sala-pesi', 'corsi', 'sauna'], $gym->amenities);
        $this->assertSame('info@fitlab.it', $gym->email);
        $this->assertSame('https://www.fitlab.it', $gym->website);
        $this->assertSame('fitlab.milano', $gym->instagram);
        $this->assertNotNull($gym->cover);
        $this->assertCount(1, $gym->galleryPhotos);
        Storage::disk('public')->assertExists($gym->cover->path);

        // 24:00 is saved as 23:59 and read back as 24:00.
        $this->assertSame(
            [[1, '06:30', '13:00'], [1, '15:00', '22:30'], [7, '00:00', '23:59']],
            $gym->openingHours->map(fn ($range) => [$range->weekday, $range->opens(), $range->closes()])->all(),
        );
    }

    public function test_hours_must_be_in_order_and_not_overlap()
    {
        $this->post(route('gym.register.store'), [...$this->account(), ...$this->profile([
            'hours' => [0 => [['opens' => '09:00', 'closes' => '13:00'], ['opens' => '12:00', 'closes' => '18:00']]],
        ])])->assertSessionHasErrors('hours.0');

        $this->post(route('gym.register.store'), [...$this->account(), ...$this->profile([
            'hours' => [0 => [['opens' => '18:00', 'closes' => '09:00']]],
        ])])->assertSessionHasErrors('hours.0');

        $this->assertDatabaseCount('gym_profiles', 0);
    }

    public function test_continue_checks_only_the_fields_of_the_step()
    {
        $this->post(route('gym.register.check', 2), ['name' => '', 'city' => 'milano'])
            ->assertSessionHasErrors(['name', 'address', 'description'])
            ->assertSessionDoesntHaveErrors(['cover', 'amenities', 'email']);
    }

    public function test_clients_and_trainers_cant_register_a_gym_with_their_account()
    {
        $client = User::factory()->create();

        $this->actingAs($client)->get(route('gym.register'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('onboarding/gym-registration')
                ->where('otherAccount', true)
                ->where('editing', false));
        $this->actingAs($client)->post(route('gym.register.store'), $this->profile())->assertRedirect(route('client.home'));

        $this->assertSame(UserRole::Client, $client->fresh()->role);
    }

    public function test_a_client_signs_out_to_register_the_gym_with_another_account()
    {
        $client = User::factory()->create();

        $this->actingAs($client)->post(route('gym.register.switch'))->assertRedirect(route('gym.register'));

        $this->assertGuest();
        $this->get(route('gym.register'))->assertInertia(fn (Assert $page) => $page->where('otherAccount', false));
    }

    public function test_a_gym_sees_its_area_and_other_roles_are_sent_to_theirs()
    {
        $gym = GymProfile::factory()->approved()->create();

        $this->actingAs($gym->user)->get(route('gym.dashboard'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('gym/dashboard')
                ->where('name', $gym->name)
                ->where('gymArea.profile.status', 'approved')
            );

        // The gym can't open the trainer area or the trainer registration.
        $this->actingAs($gym->user)->get(route('trainer.today'))->assertRedirect(route('gym.dashboard'));
        $this->actingAs($gym->user)->get(route('trainer.register'))->assertRedirect(route('gym.dashboard'));
        $this->actingAs($gym->user)->get(route('dashboard'))->assertRedirect(route('gym.dashboard'));

        $this->actingAs(User::factory()->create())->get(route('gym.dashboard'))->assertRedirect(route('client.home'));
    }

    public function test_an_approved_gym_edits_its_profile_without_a_new_review()
    {
        $gym = GymProfile::factory()->approved()->create();
        $gym->photos()->create(['path' => 'gyms/old.jpg', 'is_cover' => true]);

        $this->actingAs($gym->user)
            ->put(route('gym.profile.update'), $this->profile(['name' => 'FitLab Due', 'cover' => null, 'gallery' => []]))
            ->assertRedirect(route('gym.profile.edit'));

        $gym->refresh();
        $this->assertSame('FitLab Due', $gym->name);
        $this->assertSame(TrainerProfileStatus::Approved, $gym->status);
        // The cover stays when no new one is sent.
        $this->assertSame('gyms/old.jpg', $gym->cover->path);
    }

    public function test_the_team_approves_a_gym_and_the_gym_gets_an_email()
    {
        $gym = GymProfile::factory()->create();

        $this->actingAs(User::factory()->admin()->create())
            ->get(route('admin.gym-verification'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/gym-verification')
                ->where('gyms.0.id', $gym->id)
                ->where('gyms.0.warnings', fn ($warnings) => collect($warnings)->contains('Manca la foto di copertina'))
            );

        $this->post(route('admin.gym-verification.decide', $gym), ['decision' => 'approved'])->assertRedirect();

        $this->assertSame(TrainerProfileStatus::Approved, $gym->fresh()->status);
        $this->assertSame(TrainerReviewDecision::Approved, $gym->decisions()->first()->decision);
        Notification::assertSentTo($gym->user, GymProfileDecided::class);
    }

    public function test_a_rejection_needs_a_message_and_only_admins_decide()
    {
        $gym = GymProfile::factory()->create();

        $this->actingAs(User::factory()->admin()->create())
            ->post(route('admin.gym-verification.decide', $gym), ['decision' => 'rejected'])
            ->assertSessionHasErrors('message');

        $this->actingAs($gym->user)
            ->post(route('admin.gym-verification.decide', $gym), ['decision' => 'approved'])
            ->assertForbidden();

        $this->assertSame(TrainerProfileStatus::Review, $gym->fresh()->status);
    }

    public function test_gallery_photos_are_added_and_one_becomes_the_cover()
    {
        $gym = GymProfile::factory()->approved()->create();
        $cover = $gym->photos()->create(['path' => 'gyms/cover.jpg', 'is_cover' => true]);

        $this->actingAs($gym->user)
            ->post(route('gym.photos.store'), ['photos' => [UploadedFile::fake()->image('a.jpg', 1200, 800)]])
            ->assertRedirect();

        $photo = $gym->galleryPhotos()->firstOrFail();

        $this->post(route('gym.photos.cover', $photo))->assertRedirect();
        $this->assertTrue($photo->fresh()->is_cover);
        $this->assertFalse($cover->fresh()->is_cover);

        // Another gym's photo: as if it didn't exist.
        $other = GymProfile::factory()->approved()->create();
        $this->actingAs($other->user)->delete(route('gym.photos.destroy', $cover))->assertNotFound();
    }

    public function test_deleting_the_account_deletes_the_gym_and_its_files()
    {
        $gym = GymProfile::factory()->approved()->inCity(City::where('slug', 'milano')->firstOrFail())->create();
        Storage::disk('public')->put("gyms/{$gym->id}/cover.jpg", 'x');
        $gym->photos()->create(['path' => "gyms/{$gym->id}/cover.jpg", 'is_cover' => true]);

        app(DeleteUser::class)->handle($gym->user);

        $this->assertDatabaseCount('gym_profiles', 0);
        $this->assertDatabaseCount('gym_photos', 0);
        Storage::disk('public')->assertMissing("gyms/{$gym->id}/cover.jpg");
    }
}
