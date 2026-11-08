<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\BuildsAdminPlaceholderData;
use App\Http\Controllers\Controller;
use App\Models\GroupSession;
use App\Support\GroupSessionCard;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Eventi": the events of trainers and gyms, published at once; the team
 * can hide one ("Nascondi": off the lists and its page) and show it again.
 * The lessons of the courses are left out.
 */
class AdminEventsController extends Controller
{
    use BuildsAdminPlaceholderData;

    private const LIMIT = 200;

    public function __invoke(): Response
    {
        $events = GroupSessionCard::load(GroupSession::query()->whereNull('gym_course_lesson_id'))
            ->where('ends_at', '>', now()->subDays(7))
            ->orderBy('starts_at')
            ->limit(self::LIMIT)
            ->get();

        return Inertia::render('admin/events', [
            'adminArea' => $this->adminArea(),
            'events' => $events->map(fn (GroupSession $event) => [
                ...GroupSessionCard::from($event),
                'description' => $event->description,
                'hidden' => $event->hidden_at !== null,
                'createdAt' => $event->created_at?->toIso8601ZuluString(),
            ])->values()->all(),
        ]);
    }

    public function hide(GroupSession $event): RedirectResponse
    {
        $event->update(['hidden_at' => now()]);

        return back();
    }

    public function show(GroupSession $event): RedirectResponse
    {
        $event->update(['hidden_at' => null]);

        return back();
    }
}
