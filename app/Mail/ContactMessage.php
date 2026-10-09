<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * A message from the Contatti page. The same email goes to the team
 * and, as a copy, to the person who wrote it.
 */
class ContactMessage extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * @param  array{roleLabel: string, topicLabel: string, name: string, email: string, message: string}  $contact
     * @param  bool  $isCopy  true for the copy sent to the person who wrote
     */
    public function __construct(
        public array $contact,
        public bool $isCopy = false,
    ) {}

    public function envelope(): Envelope
    {
        if ($this->isCopy) {
            return new Envelope(subject: 'Abbiamo ricevuto il tuo messaggio');
        }

        return new Envelope(
            // "Rispondi" in the team's inbox writes straight to the sender.
            replyTo: [new Address($this->contact['email'], $this->contact['name'])],
            subject: "Contatti · {$this->contact['topicLabel']} · {$this->contact['name']}",
        );
    }

    public function content(): Content
    {
        return new Content(markdown: 'mail.contact-message');
    }
}
