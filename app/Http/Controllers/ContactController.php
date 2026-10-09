<?php

namespace App\Http\Controllers;

use App\Http\Requests\ContactRequest;
use App\Mail\ContactMessage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;

/** "Contatti": the form sends an email to the team and a copy to the sender. */
class ContactController extends Controller
{
    public function show(Request $request): Response
    {
        return Inertia::render('public/contacts', [
            'sent' => $request->session()->get('status') === 'contact-sent',
            'email' => config('mail.contact_address'),
            'roles' => $this->options(ContactRequest::ROLES),
            // role => the topics of that role, e.g. 'trainer' => [Il mio profilo, …].
            'topics' => array_map(
                fn (array $values) => array_map(
                    fn (string $value) => ['value' => $value, 'label' => ContactRequest::TOPICS[$value]],
                    $values,
                ),
                ContactRequest::ROLE_TOPICS,
            ),
            'messageMaxLength' => ContactRequest::MESSAGE_MAX_LENGTH,
        ]);
    }

    /**
     * TODO: also save the message for "Admin · Messaggi" once the table exists.
     */
    public function store(ContactRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $contact = [
            'roleLabel' => ContactRequest::ROLES[$data['role']],
            'topicLabel' => ContactRequest::TOPICS[$data['topic']],
            'name' => trim($data['name']),
            'email' => $data['email'],
            'message' => trim($data['message']),
        ];

        Mail::to(config('mail.contact_address'))->send(new ContactMessage($contact));
        Mail::to($contact['email'], $contact['name'])->send(new ContactMessage($contact, isCopy: true));

        return to_route('contact.show')->with('status', 'contact-sent');
    }

    /**
     * @param  array<string, string>  $labels
     * @return list<array{value: string, label: string}>
     */
    private function options(array $labels): array
    {
        return array_map(
            fn (string $value, string $label) => ['value' => $value, 'label' => $label],
            array_keys($labels),
            array_values($labels),
        );
    }
}
