<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\BuildsAdminPlaceholderData;
use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Messaggi": the messages of the Contatti page, the newest first. The team
 * answers by email ("Rispondi") and marks them as read.
 */
class AdminMessagesController extends Controller
{
    use BuildsAdminPlaceholderData;

    /** Enough for the beta. */
    private const LIMIT = 200;

    public function __invoke(): Response
    {
        $messages = ContactMessage::query()
            ->latest('id')
            ->limit(self::LIMIT)
            ->get();

        return Inertia::render('admin/messages', [
            'adminArea' => $this->adminArea(),
            'messages' => $messages->map(fn (ContactMessage $message) => [
                'id' => $message->id,
                'name' => $message->name,
                'email' => $message->email,
                'role' => $message->roleLabel(),
                'topic' => $message->topicLabel(),
                'message' => $message->message,
                'createdAt' => $message->created_at?->toIso8601ZuluString(),
                'read' => $message->read_at !== null,
                // "Iscritto": the sender was logged in when writing.
                'registered' => $message->user_id !== null,
            ])->all(),
        ]);
    }

    public function markRead(ContactMessage $message): RedirectResponse
    {
        $message->forceFill(['read_at' => now()])->save();

        return back();
    }

    public function markUnread(ContactMessage $message): RedirectResponse
    {
        $message->forceFill(['read_at' => null])->save();

        return back();
    }
}
