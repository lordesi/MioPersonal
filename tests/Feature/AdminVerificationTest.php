<?php

namespace Tests\Feature;

use App\Enums\TrainerProfileStatus;
use App\Enums\TrainerReviewDecision;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Notifications\TrainerProfileDecided;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** "Admin · Verifica": the team approves, asks for changes or rejects a profile. */
class AdminVerificationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Notification::fake();
        Storage::fake('local');
    }

    private function profileWithCertificate(): TrainerProfile
    {
        $profile = TrainerProfile::factory()->create(['bio' => 'Scrivimi al 333 000 0000 per info.']);
        Storage::disk('local')->put('trainers/certificate.pdf', 'pdf');
        $profile->documents()->create(['type' => 'certificate', 'title' => 'ISSA Personal Trainer', 'issuer' => 'ISSA', 'year' => 2020, 'path' => 'trainers/certificate.pdf']);

        return $profile;
    }

    public function test_the_queue_shows_the_profiles_waiting_with_their_warnings()
    {
        $profile = $this->profileWithCertificate();
        TrainerProfile::factory()->approved()->create(['status_changed_at' => now()->subDays(3)]);

        $this->actingAs(User::factory()->admin()->create())
            ->get(route('admin.verification'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('trainers', 1)
                ->where('trainers.0.id', $profile->id)
                ->where('trainers.0.status', 'review')
                ->where('trainers.0.warnings', ['La bio contiene un numero di telefono', 'Manca la foto profilo'])
                ->where('trainers.0.certifications.0.title', 'ISSA Personal Trainer')
                ->whereType('trainers.0.certifications.0.fileHref', 'string')
                ->where('adminArea.verificationCount', 1)
            );
    }

    public function test_approving_publishes_the_profile_emails_the_trainer_and_deletes_the_files()
    {
        $profile = $this->profileWithCertificate();
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->from(route('admin.verification'))
            ->post(route('admin.verification.decide', $profile), ['decision' => 'approved', 'internal_note' => 'Tutto ok'])
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('admin.verification'));

        $profile->refresh();
        $this->assertSame(TrainerProfileStatus::Approved, $profile->status);
        $this->assertNotNull($profile->approved_at);

        $review = $profile->decisions()->first();
        $this->assertSame(TrainerReviewDecision::Approved, $review?->decision);
        $this->assertSame($admin->id, $review?->admin_id);
        $this->assertSame('Tutto ok', $review?->internal_note);

        // The file goes, title and issuer stay on the profile.
        $document = $profile->documents()->first();
        $this->assertNull($document?->path);
        $this->assertNotNull($document?->verified_at);
        Storage::disk('local')->assertMissing('trainers/certificate.pdf');

        Notification::assertSentTo($profile->user, TrainerProfileDecided::class);
    }

    public function test_asking_for_changes_saves_the_reasons_and_the_message()
    {
        $profile = $this->profileWithCertificate();

        $this->actingAs(User::factory()->admin()->create())
            ->post(route('admin.verification.decide', $profile), [
                'decision' => 'changes',
                'reasons' => ['Bio con contatti o link'],
                'message' => 'Togli il numero dalla bio.',
            ])
            ->assertSessionHasNoErrors();

        $this->assertSame(TrainerProfileStatus::Changes, $profile->refresh()->status);
        $this->assertSame(['Bio con contatti o link'], $profile->decisions()->first()?->reasons);
        // Changes keep the files: the team may need them again.
        Storage::disk('local')->assertExists('trainers/certificate.pdf');

        // The trainer sees the message at the top of the area.
        $this->actingAs($profile->user)
            ->get(route('trainer.today'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('trainerArea.profile', ['status' => 'changes', 'message' => 'Togli il numero dalla bio.'])
            );
    }

    public function test_a_rejection_needs_a_reason_and_can_be_undone()
    {
        $profile = $this->profileWithCertificate();
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->post(route('admin.verification.decide', $profile), ['decision' => 'rejected'])
            ->assertSessionHasErrors('message');
        $this->assertSame(TrainerProfileStatus::Review, $profile->refresh()->status);

        $this->post(route('admin.verification.decide', $profile), ['decision' => 'rejected', 'message' => 'Attestati non validi.'])
            ->assertSessionHasNoErrors();
        $this->assertSame(TrainerProfileStatus::Rejected, $profile->refresh()->status);

        // Decided in the last 24 hours: still in the list, with "Annulla decisione".
        $this->get(route('admin.verification'))
            ->assertInertia(fn (Assert $page) => $page->where('trainers.0.status', 'rejected'));

        $this->post(route('admin.verification.decide', $profile), ['decision' => 'undone'])->assertSessionHasNoErrors();
        $this->assertSame(TrainerProfileStatus::Review, $profile->refresh()->status);

        // A decision on a profile that is no longer waiting is refused.
        $profile->forceFill(['status' => TrainerProfileStatus::Approved])->save();
        $this->post(route('admin.verification.decide', $profile), ['decision' => 'rejected', 'message' => 'No'])
            ->assertSessionHasErrors('decision');
        $this->assertSame(TrainerProfileStatus::Approved, $profile->refresh()->status);
    }

    public function test_only_admins_decide_and_open_certificates_with_a_signed_link()
    {
        $profile = $this->profileWithCertificate();
        $document = $profile->documents()->firstOrFail();

        $this->actingAs($profile->user)
            ->post(route('admin.verification.decide', $profile), ['decision' => 'approved'])
            ->assertForbidden();

        $admin = User::factory()->admin()->create();
        $signed = URL::temporarySignedRoute('admin.verification.certificate', now()->addMinutes(10), $document);

        // Without the signature, or as a trainer, the file stays closed.
        $this->actingAs($admin)->get(route('admin.verification.certificate', $document))->assertForbidden();
        $this->actingAs($profile->user)->get($signed)->assertForbidden();
        $this->actingAs($admin)->get($signed)->assertOk();
    }
}
