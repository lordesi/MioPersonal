<?php

namespace Tests\Feature;

use App\Actions\Account\DeleteUser;
use App\Mail\ProblemReported;
use App\Models\ProblemReport;
use App\Models\User;
use App\Support\DeviceLabel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ProblemReportTest extends TestCase
{
    use RefreshDatabase;

    private const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';

    protected function setUp(): void
    {
        parent::setUp();

        Mail::fake();
        Storage::fake(ProblemReport::DISK);
        config(['mail.contact_address' => 'team@example.com']);
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function form(array $overrides = []): array
    {
        return [
            'message' => '  Ho premuto «Prenota» e non è successo niente.  ',
            'page' => '/trainer/anna-rossi',
            'viewport' => '390×844',
            'installed' => '1',
            ...$overrides,
        ];
    }

    public function test_guests_cannot_send_a_report()
    {
        $this->post(route('problem-reports.store'), $this->form())->assertRedirect(route('login'));

        $this->assertDatabaseCount('problem_reports', 0);
        Mail::assertNothingQueued();
    }

    public function test_a_trainer_sends_a_report_with_a_screenshot_and_the_team_gets_an_email()
    {
        $user = User::factory()->trainer()->create(['name' => 'Marco Bianchi']);

        $this->actingAs($user)
            ->from('/area-trainer/oggi')
            ->withHeader('User-Agent', self::IPHONE)
            ->post(route('problem-reports.store'), $this->form([
                'screenshot' => UploadedFile::fake()->image('schermata.png', 390, 844),
            ]))
            ->assertRedirect('/area-trainer/oggi')
            ->assertInertiaFlash('toast.type', 'success');

        $report = ProblemReport::sole();
        $this->assertSame($user->id, $report->user_id);
        $this->assertSame('trainer', $report->role);
        $this->assertSame('Ho premuto «Prenota» e non è successo niente.', $report->message);
        $this->assertSame('/trainer/anna-rossi', $report->page);
        $this->assertSame('iPhone · Safari', $report->device);
        $this->assertSame('390×844', $report->viewport);
        $this->assertTrue($report->installed);
        $this->assertNotNull($report->screenshot_path);
        Storage::disk(ProblemReport::DISK)->assertExists($report->screenshot_path);

        Mail::assertQueued(ProblemReported::class, fn (ProblemReported $mail) => $mail->hasTo('team@example.com')
            && $mail->hasReplyTo($user->email)
            && $mail->report->is($report));
        Mail::assertQueuedCount(1);
    }

    public function test_the_page_keeps_only_the_path_without_tokens_or_query_string()
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post(route('problem-reports.store'), $this->form([
            'page' => '//evil.example/prenota/'.str_repeat('a1', 20).'?email=anna%40example.com',
            'viewport' => 'anything',
        ]))->assertSessionHasErrors('viewport');

        $this->actingAs($user)->post(route('problem-reports.store'), $this->form([
            'page' => '//evil.example/prenota/'.str_repeat('a1', 20).'?email=anna%40example.com',
        ]))->assertSessionHasNoErrors();

        $this->assertSame('/evil.example/prenota/{token}', ProblemReport::sole()->page);
    }

    public function test_the_text_is_required_and_the_screenshot_must_be_an_image()
    {
        $this->actingAs(User::factory()->create())
            ->post(route('problem-reports.store'), $this->form([
                'message' => '   ',
                'screenshot' => UploadedFile::fake()->create('virus.pdf', 10, 'application/pdf'),
            ]))
            ->assertSessionHasErrors(['message', 'screenshot']);

        $this->assertDatabaseCount('problem_reports', 0);
    }

    public function test_a_user_cannot_send_dozens_of_reports()
    {
        $user = User::factory()->create();

        for ($i = 0; $i < 10; $i++) {
            $this->actingAs($user)->post(route('problem-reports.store'), $this->form())->assertRedirect();
        }

        $this->actingAs($user)->post(route('problem-reports.store'), $this->form())->assertTooManyRequests();
        $this->assertDatabaseCount('problem_reports', 10);
    }

    public function test_the_device_is_described_in_words()
    {
        $this->assertSame('iPhone · Safari', DeviceLabel::from(self::IPHONE));
        $this->assertSame('Android · Chrome', DeviceLabel::from('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36'));
        $this->assertSame('Android · Samsung Internet', DeviceLabel::from('Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0 Mobile Safari/537.36'));
        $this->assertSame('Windows · Edge', DeviceLabel::from('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36 Edg/131.0'));
        $this->assertSame('Mac · Firefox', DeviceLabel::from('Mozilla/5.0 (Macintosh; Intel Mac OS X 14.1; rv:132.0) Gecko/20100101 Firefox/132.0'));
        $this->assertSame('Sconosciuto', DeviceLabel::from(null));
    }

    public function test_admins_list_solve_and_reopen_the_reports_and_open_the_screenshot()
    {
        $user = User::factory()->create(['name' => 'Giulia Verdi']);
        $this->actingAs($user)->post(route('problem-reports.store'), $this->form([
            'screenshot' => UploadedFile::fake()->image('schermata.jpg', 400, 800),
        ]));
        $report = ProblemReport::sole();

        $admin = User::factory()->admin()->create();
        $this->actingAs($admin)->get(route('admin.problems'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/problems')
                ->where('adminArea.openProblems', 1)
                ->has('problems', 1)
                ->where('problems.0.name', 'Giulia Verdi')
                ->where('problems.0.role', 'Cliente')
                ->where('problems.0.page', '/trainer/anna-rossi')
                ->where('problems.0.solved', false)
                ->whereType('problems.0.screenshotUrl', 'string')
            );

        $this->actingAs($admin)->post(route('admin.problems.solve', $report))->assertRedirect();
        $this->assertNotNull($report->fresh()->resolved_at);
        $this->assertSame($admin->id, $report->fresh()->resolved_by);

        $this->actingAs($admin)->delete(route('admin.problems.reopen', $report))->assertRedirect();
        $this->assertNull($report->fresh()->resolved_at);

        // The screenshot opens only with the temporary link of the page.
        $this->actingAs($admin)->get(route('admin.problems.screenshot', $report))->assertForbidden();
        $this->actingAs($admin)->get(URL::temporarySignedRoute('admin.problems.screenshot', now()->addMinutes(10), ['report' => $report]))->assertOk();
    }

    public function test_other_users_cannot_see_the_reports()
    {
        $this->actingAs(User::factory()->create())->get(route('admin.problems'))->assertForbidden();
    }

    public function test_reports_and_screenshots_go_after_90_days_and_with_the_account()
    {
        $old = User::factory()->create();
        $leaving = User::factory()->create();

        $this->actingAs($old)->post(route('problem-reports.store'), $this->form(['screenshot' => UploadedFile::fake()->image('a.png', 300, 600)]));
        $this->actingAs($leaving)->post(route('problem-reports.store'), $this->form(['screenshot' => UploadedFile::fake()->image('b.png', 300, 600)]));
        [$oldReport, $leavingReport] = ProblemReport::query()->orderBy('id')->get()->all();
        $oldReport->forceFill(['created_at' => now()->subDays(ProblemReport::RETENTION_DAYS + 1)])->save();

        $this->artisan('problem-reports:prune')->assertSuccessful();

        $this->assertModelMissing($oldReport);
        Storage::disk(ProblemReport::DISK)->assertMissing((string) $oldReport->screenshot_path);
        $this->assertModelExists($leavingReport);

        app(DeleteUser::class)->handle($leaving);

        $this->assertDatabaseCount('problem_reports', 0);
        Storage::disk(ProblemReport::DISK)->assertMissing((string) $leavingReport->screenshot_path);
    }
}
