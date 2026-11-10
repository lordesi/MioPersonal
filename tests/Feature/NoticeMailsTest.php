<?php

namespace Tests\Feature;

use App\Enums\TrainerReviewDecision;
use App\Models\GroupSession;
use App\Models\GymProfileReview;
use App\Models\TrainerProfileReview;
use App\Models\User;
use App\Notifications\GroupSessionChanged;
use App\Notifications\GymProfileDecided;
use App\Notifications\TrainerProfileDecided;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Mail\Mailer;
use Tests\TestCase;

/** The emails that are still sent and use the generic layout (resources/views/mail/notice). */
class NoticeMailsTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_trainer_decision_with_changes_lists_the_reasons_in_the_email_layout()
    {
        $review = (new TrainerProfileReview)->forceFill([
            'decision' => TrainerReviewDecision::Changes,
            'reasons' => ['Aggiungi una foto', 'Descrivi i servizi'],
            'message_to_trainer' => "Quasi pronto.\nCi vediamo online!",
        ]);
        $user = User::factory()->create();

        $mail = (new TrainerProfileDecided($review, 'https://example.test/profilo'))->toMail($user);
        $html = (string) $mail->render();

        $this->assertSame('Manca poco: sistema il tuo profilo', $mail->subject);
        // The MioPersonal layout, not Laravel's grey one.
        $this->assertStringContainsString('mp-card', $html);
        $this->assertStringContainsString('<li style="margin:0 0 4px;">Aggiungi una foto</li>', $html);
        $this->assertStringContainsString('Descrivi i servizi', $html);
        $this->assertStringContainsString('Quasi pronto.', $html);
        $this->assertStringContainsString(route('trainer.register'), $html);

        $text = app(Mailer::class)->render(['text' => $mail->view[1]], $mail->data());
        $this->assertStringContainsString('- Aggiungi una foto', $text);
        $this->assertStringContainsString('Modifica il profilo:', $text);
    }

    public function test_the_trainer_decision_is_also_in_the_bell_and_the_push()
    {
        $review = (new TrainerProfileReview)->forceFill(['decision' => TrainerReviewDecision::Approved]);
        $user = User::factory()->create();

        $notification = new TrainerProfileDecided($review, 'https://example.test/trainer/giulia');

        $this->assertSame(['mail', 'database'], $notification->via($user));
        $this->assertSame([
            'title' => 'Il tuo profilo è online',
            'body' => 'Abbiamo controllato il tuo profilo: ora compare nella ricerca di MioPersonal e i clienti possono prenotare.',
            'url' => '/trainer/giulia',
        ], $notification->toArray($user));
    }

    public function test_a_rejected_gym_has_no_button()
    {
        $review = (new GymProfileReview)->forceFill([
            'decision' => TrainerReviewDecision::Rejected,
            'message_to_gym' => 'Non possiamo pubblicarlo.',
        ]);

        $html = (string) (new GymProfileDecided($review, 'https://example.test/palestra'))->toMail(User::factory()->create())->render();

        $this->assertStringContainsString('Il profilo della palestra non è stato approvato', $html);
        $this->assertStringContainsString('Non possiamo pubblicarlo.', $html);
        // "mp-btn-a" is also in the CSS of the layout: the button is the table with class="mp-btn-t".
        $this->assertStringNotContainsString('class="mp-btn-t"', $html);
    }

    public function test_a_cancelled_event_shows_the_message_of_the_organizer()
    {
        $session = GroupSession::factory()->create(['cancel_note' => 'Maltempo, ci vediamo la prossima settimana.']);
        $user = User::factory()->create();

        $mail = (new GroupSessionChanged($session, GroupSessionChanged::CANCELLED))->toMail($user);
        $html = (string) $mail->render();

        $this->assertSame("Evento annullato: {$session->title}", $mail->subject);
        $this->assertStringContainsString('è stato annullato dall’organizzatore', $html);
        $this->assertStringContainsString('Maltempo, ci vediamo la prossima settimana.', $html);
        $this->assertStringContainsString(route('events.show', $session->slug), $html);
    }
}
