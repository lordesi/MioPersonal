<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Booking;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Support\TrainerSlots;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** Trainer settings: "Visibilità del profilo", "Contatti per i clienti", "Chiudi il profilo". */
class TrainerProfileSettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_visibility_and_pause_are_saved()
    {
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-10-11 10:00', 'Europe/Rome'));
        $profile = TrainerProfile::factory()->approved()->create();

        $this->actingAs($profile->user)
            ->patch(route('trainer.visibility.update'), [
                'visible_in_search' => false,
                'accepts_new_clients' => true,
                'pause' => '1w',
            ])
            ->assertSessionHasNoErrors();

        $profile->refresh();
        $this->assertFalse($profile->visible_in_search);
        // Bookable again on Sunday 18 October, in Rome.
        $this->assertSame('2026-10-18 00:00', $profile->paused_until?->setTimezone('Europe/Rome')->format('Y-m-d H:i'));

        $this->get(route('trainer.settings'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('visibility', ['visibleInSearch' => false, 'acceptsNewClients' => true, 'pausedUntil' => '2026-10-18', 'paused' => false])
            );

        // "Riprendi ora"; without "pause" the pause stays as it is.
        $this->patch(route('trainer.visibility.update'), ['visible_in_search' => true, 'accepts_new_clients' => true, 'pause' => 'none']);
        $this->assertNull($profile->refresh()->paused_until);

        CarbonImmutable::setTestNow();
    }

    public function test_metti_in_pausa_hides_the_profile_until_it_is_turned_back_on()
    {
        // refresh(): the rules with a default in the database (e.g. booking_window_days).
        $profile = TrainerProfile::factory()->approved()->bookable()->create()->refresh();
        TrainerSlots::refresh($profile);
        $this->assertNotNull($profile->next_free_slot_at);

        $this->actingAs($profile->user)
            ->patch(route('trainer.pause.update'), ['paused' => true])
            ->assertSessionHasNoErrors();

        $profile->refresh();
        $this->assertNotNull($profile->paused_at);
        // Out of the search, and no free slots.
        $this->assertFalse(TrainerProfile::published()->whereKey($profile->id)->exists());
        $this->assertNull($profile->next_free_slot_at);
        $this->get(route('trainer.settings'))
            ->assertInertia(fn (Assert $page) => $page->where('visibility.paused', true));

        // Nobody can book, not even with an old link to a slot.
        $this->actingAs(User::factory()->create())
            ->post(route('trainers.book', $profile->slug), [
                'service_id' => $profile->services()->where('minutes', 60)->value('id'),
                'start' => now()->addDays(2)->setTime(18, 0)->toIso8601String(),
                'minutes' => 60,
            ])
            ->assertSessionHasErrors(['start' => 'Al momento questo trainer non accetta prenotazioni.']);
        $this->assertSame(0, Booking::count());

        // "Riattiva profilo".
        $this->actingAs($profile->user)
            ->patch(route('trainer.pause.update'), ['paused' => false])
            ->assertSessionHasNoErrors();

        $profile->refresh();
        $this->assertNull($profile->paused_at);
        $this->assertTrue(TrainerProfile::published()->whereKey($profile->id)->exists());
        $this->assertNotNull($profile->next_free_slot_at);
    }

    public function test_contacts_for_the_clients_are_saved()
    {
        $profile = TrainerProfile::factory()->create();

        $this->actingAs($profile->user)
            ->patch(route('trainer.contacts.update'), [
                'show_phone' => false,
                'show_email' => true,
                'arrival_notes' => ' Citofono «Studio 3B» ',
            ])
            ->assertSessionHasNoErrors();

        $profile->refresh();
        $this->assertFalse($profile->show_phone);
        $this->assertTrue($profile->show_email);
        $this->assertSame('Citofono «Studio 3B»', $profile->arrival_notes);
    }

    public function test_closing_the_profile_deletes_it_and_the_trainer_becomes_a_client()
    {
        Storage::fake('public');
        Storage::fake('local');
        $profile = TrainerProfile::factory()->create();
        Storage::disk('public')->put('trainers/photo.jpg', 'jpg');
        Storage::disk('local')->put('trainers/certificate.pdf', 'pdf');
        $profile->photos()->create(['path' => 'trainers/photo.jpg', 'is_portrait' => true]);
        $profile->documents()->create(['title' => 'Attestato', 'path' => 'trainers/certificate.pdf']);
        $user = $profile->user;

        $this->actingAs($user)
            ->delete(route('trainer.profile.close'), [])
            ->assertSessionHasErrors('acknowledged');

        $this->delete(route('trainer.profile.close'), ['acknowledged' => true])
            ->assertRedirect(route('account.settings'));

        $this->assertSame(UserRole::Client, $user->refresh()->role);
        $this->assertSame(0, TrainerProfile::count());
        Storage::disk('public')->assertMissing('trainers/photo.jpg');
        Storage::disk('local')->assertMissing('trainers/certificate.pdf');
    }

    public function test_without_a_profile_the_trainer_sections_are_hidden()
    {
        $this->actingAs(User::factory()->trainer()->create())
            ->get(route('trainer.settings'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('visibility', null)
                ->where('contacts', null)
            );

        $this->patch(route('trainer.contacts.update'), ['show_phone' => true, 'show_email' => true])
            ->assertNotFound();
    }
}
