<?php

namespace Tests\Feature;

use App\Mail\ContactMessage;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ContactTest extends TestCase
{
    /** @return array<string, string> */
    private function validForm(array $overrides = []): array
    {
        return [
            'role' => 'trainer',
            'topic' => 'verification',
            'name' => 'Sofia Bassi',
            'email' => 'sofia@example.com',
            'message' => 'Ho inviato il profilo due giorni fa: è tutto a posto?',
            'privacy' => '1',
            ...$overrides,
        ];
    }

    public function test_the_page_lists_roles_and_the_topics_of_each_role()
    {
        config(['mail.contact_address' => 'team@example.com']);

        $this->get(route('contact.show'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('public/contacts')
                ->where('sent', false)
                ->where('email', 'team@example.com')
                ->has('roles', 3)
                ->where('topics.client.0.label', 'Una prenotazione')
                ->where('topics.trainer.1.label', 'Verifica e approvazione')
                ->has('topics.other', 4)
            );
    }

    public function test_a_message_is_sent_to_the_team_with_a_copy_to_the_sender()
    {
        Mail::fake();
        config(['mail.contact_address' => 'team@example.com']);

        $this->post(route('contact.store'), $this->validForm())
            ->assertRedirect(route('contact.show'))
            ->assertSessionHas('status', 'contact-sent');

        Mail::assertSent(ContactMessage::class, fn (ContactMessage $mail) => $mail->hasTo('team@example.com')
            && ! $mail->isCopy
            && $mail->hasReplyTo('sofia@example.com')
            && $mail->contact['topicLabel'] === 'Verifica e approvazione');

        Mail::assertSent(ContactMessage::class, fn (ContactMessage $mail) => $mail->hasTo('sofia@example.com')
            && $mail->isCopy);

        Mail::assertSentCount(2);
    }

    public function test_after_sending_the_page_shows_message_sent()
    {
        Mail::fake();

        $this->followingRedirects()
            ->post(route('contact.store'), $this->validForm())
            ->assertInertia(fn (Assert $page) => $page->where('sent', true));
    }

    public function test_the_topic_must_belong_to_the_chosen_role()
    {
        Mail::fake();

        // "Stampa" is offered only to "Altro", not to clients.
        $this->post(route('contact.store'), $this->validForm(['role' => 'client', 'topic' => 'press']))
            ->assertSessionHasErrors('topic');

        Mail::assertNothingSent();
    }

    public function test_the_privacy_consent_and_the_message_are_required()
    {
        Mail::fake();

        $this->post(route('contact.store'), $this->validForm(['privacy' => null, 'message' => '']))
            ->assertSessionHasErrors(['privacy', 'message']);

        Mail::assertNothingSent();
    }

    public function test_the_message_has_a_maximum_length()
    {
        $this->post(route('contact.store'), $this->validForm(['message' => str_repeat('a', 1501)]))
            ->assertSessionHasErrors('message');
    }
}
