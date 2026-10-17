<?php

namespace Tests\Feature;

use App\Enums\TrainerProfileStatus;
use App\Models\TrainerPhoto;
use App\Models\TrainerProfile;
use App\Models\User;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** "Modifica profilo": an approved trainer changes steps 2, 3 and 6, public right away. */
class TrainerProfileEditTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(CatalogSeeder::class);
        Storage::fake(TrainerPhoto::DISK);
        Storage::fake('local');
    }

    /**
     * What the page sends (toProfilePayload in draft.ts): no services, hours and rules.
     *
     * @param  array<string, mixed>  $changes
     * @return array<string, mixed>
     */
    private function payload(array $changes = []): array
    {
        return [
            'headline' => 'Pilates e postura',
            'bio' => str_repeat('Alleno persone che vogliono muoversi meglio. ', 5),
            'experience' => '5to10',
            'disciplines' => ['pilates', 'functional'],
            'places' => ['studio', 'online'],
            'studios' => [['name' => 'Studio Brera', 'address' => 'Via Solferino 3']],
            'city' => 'milano',
            'other_cities' => [],
            'certifications' => [['title' => 'Istruttore Pilates', 'issuer' => 'FIF', 'year' => '2020']],
            ...$changes,
        ];
    }

    private function approvedTrainer(): TrainerProfile
    {
        $profile = TrainerProfile::factory()->approved()->bookable()->withDisciplines(['yoga'])->create();
        $path = UploadedFile::fake()->image('ritratto.jpg', 600, 600)->store("trainers/{$profile->id}", TrainerPhoto::DISK);
        $profile->photos()->create(['path' => $path, 'caption' => 'Ritratto', 'is_portrait' => true]);

        return $profile;
    }

    public function test_the_page_shows_the_saved_profile()
    {
        $profile = $this->approvedTrainer();

        $this->actingAs($profile->user)
            ->get(route('trainer.profile.edit'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('trainer/profile')
                ->where('draft.headline', $profile->headline)
                ->where('draft.disciplines', ['yoga'])
                ->where('draft.pricing.sessions.0.name', 'Seduta singola')
                ->where('draft.pricing.sessions.0.prices', [['minutes' => 60, 'priceCents' => 4000], ['minutes' => 120, 'priceCents' => 7500]])
                ->whereNot('draft.photoUrl', null)
                ->has('disciplines')
                ->has('cities')
            );
    }

    public function test_a_profile_not_approved_yet_is_changed_from_the_registration()
    {
        $profile = TrainerProfile::factory()->status(TrainerProfileStatus::Review)->create();

        $this->actingAs($profile->user)
            ->get(route('trainer.profile.edit'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('draft', null));

        $this->actingAs($profile->user)
            ->put(route('trainer.profile.update'), $this->payload([
                'photo' => UploadedFile::fake()->image('nuova.jpg', 600, 600),
            ]))
            ->assertForbidden();

        $this->assertNotSame('Pilates e postura', $profile->fresh()?->headline);
    }

    public function test_the_trainer_saves_the_profile_without_a_new_review()
    {
        $profile = $this->approvedTrainer();
        $hours = $profile->workingHours()->count();

        $this->actingAs($profile->user)
            ->from(route('trainer.profile.edit'))
            ->put(route('trainer.profile.update'), $this->payload())
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('trainer.profile.edit'));

        $profile->refresh();
        $this->assertSame(TrainerProfileStatus::Approved, $profile->status);
        $this->assertSame('Pilates e postura', $profile->headline);
        $this->assertSame('milano', $profile->city?->slug);
        $this->assertTrue($profile->trains_in_person);
        $this->assertTrue($profile->trains_online);
        $this->assertSame(['pilates', 'functional'], $profile->disciplines->pluck('slug')->all());
        $this->assertSame(['Istruttore Pilates'], $profile->documents->pluck('title')->all());
        // Services are changed from "Servizi" only: the 2 rows of the factory stay.
        $this->assertSame([60, 120], $profile->services->sortBy('sort')->pluck('minutes')->values()->all());
        $this->assertSame(4000, $profile->price_from_cents);
        $this->assertSame([60, 120], $profile->session_minutes);
        // Hours and rules are changed from "Disponibilità" only.
        $this->assertSame($hours, $profile->workingHours()->count());
        // Without a new photo the old one stays.
        $this->assertNotNull($profile->portrait);
    }

    public function test_the_online_prices_go_when_the_places_in_person_go()
    {
        $profile = $this->approvedTrainer();
        $profile->forceFill(['trains_in_person' => true, 'price_from_cents' => 3000])->save();
        $profile->services()->create(['name' => 'Seduta singola', 'minutes' => 60, 'price_cents' => 3000, 'fixed_duration' => false, 'online_only' => true, 'sort' => 200]);

        $this->actingAs($profile->user)
            ->put(route('trainer.profile.update'), $this->payload(['places' => ['online'], 'studios' => [], 'city' => '']))
            ->assertSessionHasNoErrors();

        $profile->refresh();
        $this->assertFalse($profile->services()->where('online_only', true)->exists());
        // "da 40 €" again: the lowest price of the rows left.
        $this->assertSame(4000, $profile->price_from_cents);
    }

    public function test_a_new_photo_replaces_the_old_one()
    {
        $profile = $this->approvedTrainer();
        $old = $profile->portrait;
        $this->assertNotNull($old);

        $this->actingAs($profile->user)
            ->put(route('trainer.profile.update'), $this->payload([
                'photo' => UploadedFile::fake()->image('nuova.jpg', 800, 800),
            ]))
            ->assertSessionHasNoErrors();

        $new = $profile->fresh()?->portrait;
        $this->assertNotNull($new);
        $this->assertNotSame($old->path, $new->path);
        Storage::disk(TrainerPhoto::DISK)->assertExists($new->path);
        Storage::disk(TrainerPhoto::DISK)->assertMissing($old->path);
        $this->assertSame(1, $profile->photos()->count());
    }

    public function test_the_x_removes_the_certificate_file_and_keeps_the_certification()
    {
        $profile = $this->approvedTrainer();
        Storage::disk('local')->put('trainers/attestato.pdf', 'pdf');
        $document = $profile->documents()->create(['type' => 'certificate', 'title' => 'Istruttore Pilates', 'issuer' => 'FIF', 'year' => 2020, 'path' => 'trainers/attestato.pdf']);
        $certification = ['id' => (string) $document->id, 'title' => 'Istruttore Pilates', 'issuer' => 'FIF', 'year' => '2020'];

        // Sent again without the ✕: the file stays.
        $this->actingAs($profile->user)
            ->put(route('trainer.profile.update'), $this->payload(['certifications' => [[...$certification, 'remove_file' => '0']]]))
            ->assertSessionHasNoErrors();
        $kept = $profile->documents()->sole();
        $this->assertSame('trainers/attestato.pdf', $kept->path);

        // With the ✕: the certification stays, its file goes.
        $this->actingAs($profile->user)
            ->put(route('trainer.profile.update'), $this->payload(['certifications' => [[...$certification, 'id' => (string) $kept->id, 'remove_file' => '1']]]))
            ->assertSessionHasNoErrors();

        $document = $profile->documents()->sole();
        $this->assertSame('Istruttore Pilates', $document->title);
        $this->assertNull($document->path);
        Storage::disk('local')->assertMissing('trainers/attestato.pdf');
    }

    public function test_the_same_checks_as_the_registration()
    {
        $profile = $this->approvedTrainer();

        $this->actingAs($profile->user)
            ->put(route('trainer.profile.update'), $this->payload(['bio' => 'Troppo corta', 'city' => '']))
            ->assertSessionHasErrors(['bio', 'city']);

        $this->assertSame('Personal trainer', $profile->fresh()?->headline);
    }

    public function test_clients_cannot_open_the_page()
    {
        $client = User::factory()->create();

        $this->actingAs($client)
            ->get(route('trainer.profile.edit'))
            ->assertRedirect();
    }
}
