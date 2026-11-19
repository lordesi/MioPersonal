<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;

/**
 * The bell of the site: the latest notifications of the person who is logged in
 * (the same texts of the push), "segna tutte come lette" and "Cancella le
 * notifiche precedenti".
 */
class NotificationController extends Controller
{
    /** How many the bell shows. */
    private const LIMIT = 30;

    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return response()->json([
            'notifications' => $user->notifications()
                ->latest()
                ->limit(self::LIMIT)
                ->get()
                ->map(fn (DatabaseNotification $notification) => [
                    'id' => $notification->id,
                    'title' => (string) ($notification->data['title'] ?? ''),
                    'body' => (string) ($notification->data['body'] ?? ''),
                    // Only paths of this site: a link saved by mistake must not lead elsewhere.
                    'url' => $this->path((string) ($notification->data['url'] ?? '/')),
                    'read' => $notification->read_at !== null,
                    'createdAt' => $notification->created_at?->toIso8601String(),
                ])
                ->values(),
            'unread' => $user->unreadNotifications()->count(),
        ]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $user->unreadNotifications()->update(['read_at' => now()]);

        return response()->json(['unread' => 0]);
    }

    /**
     * "Cancella le notifiche precedenti": the ones listed, only if they are
     * the person's. By id: opening the bell already marks the new ones as read.
     */
    public function destroy(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $data = $request->validate([
            'ids' => ['required', 'array', 'max:'.self::LIMIT],
            'ids.*' => ['string', 'uuid'],
        ]);

        $user->notifications()->whereIn('id', $data['ids'])->delete();

        return response()->json(['unread' => $user->unreadNotifications()->count()]);
    }

    private function path(string $url): string
    {
        return str_starts_with($url, '/') && ! str_starts_with($url, '//') ? $url : '/';
    }
}
