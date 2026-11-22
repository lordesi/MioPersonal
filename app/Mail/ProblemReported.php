<?php

namespace App\Mail;

use App\Models\ProblemReport;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Str;

/**
 * "Segnala un problema", sent to the team (resources/views/mail/notice). The
 * screenshot is not attached: it stays private, in "Admin · Problemi segnalati".
 */
class ProblemReported extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public ProblemReport $report) {}

    public function envelope(): Envelope
    {
        $user = $this->report->user;

        return new Envelope(
            // "Rispondi" in the team's inbox writes straight to the tester.
            replyTo: [new Address($user->email, $user->name)],
            subject: 'Problema segnalato · '.Str::limit($this->report->page, 60).' · '.$user->name,
        );
    }

    public function content(): Content
    {
        $report = $this->report;
        $user = $report->user;

        return new Content(
            view: 'mail.notice',
            text: 'mail.notice-text',
            with: [
                'title' => 'Nuovo problema segnalato',
                'label' => 'Segnala un problema',
                'paragraphs' => ["Rispondi a questa email per scrivere direttamente a {$user->name}."],
                'items' => [],
                'details' => [
                    'Chi' => "{$user->name} ({$report->roleLabel()})",
                    'Email' => $user->email,
                    'Pagina' => url($report->page),
                    'Dispositivo' => $report->device.($report->installed ? ' · app installata' : ''),
                    'Schermo' => $report->viewport ?? 'Non indicato',
                    'Screenshot' => $report->screenshot_path !== null ? 'Sì, lo trovi nella pagina admin' : 'No',
                ],
                // Escaped by the view; the line breaks the person typed are kept.
                'body' => $report->message,
                'button' => 'Apri i problemi segnalati',
                'url' => route('admin.problems'),
                'footer' => 'Inviato con «Segnala un problema» su MioPersonal.',
            ],
        );
    }
}
