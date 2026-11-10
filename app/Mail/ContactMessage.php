<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * A message from the Contatti page, sent to the team (resources/views/mail/notice).
 * The person who wrote doesn't get a copy: it would use the daily limit of the
 * mail provider, and the page already says that the message was sent.
 */
class ContactMessage extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * @param  array{roleLabel: string, topicLabel: string, name: string, email: string, message: string}  $contact
     */
    public function __construct(public array $contact) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            // "Rispondi" in the team's inbox writes straight to the sender.
            replyTo: [new Address($this->contact['email'], $this->contact['name'])],
            subject: "Contatti · {$this->contact['topicLabel']} · {$this->contact['name']}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.notice',
            text: 'mail.notice-text',
            with: [
                'title' => 'Nuovo messaggio dalla pagina Contatti',
                'label' => 'Contatti',
                'paragraphs' => ["Rispondi a questa email per scrivere direttamente a {$this->contact['name']}."],
                'items' => [],
                'details' => [
                    'Sei' => $this->contact['roleLabel'],
                    'Argomento' => $this->contact['topicLabel'],
                    'Nome' => $this->contact['name'],
                    'Email' => $this->contact['email'],
                ],
                // Escaped by the view; the line breaks the person typed are kept.
                'body' => $this->contact['message'],
                'footer' => 'Messaggio inviato dal modulo della pagina Contatti di MioPersonal.',
            ],
        );
    }
}
