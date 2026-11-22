<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\BuildsAdminArea;
use App\Http\Controllers\Controller;
use App\Models\ProblemReport;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * "Problemi segnalati": what the users sent with "Segnala un problema", the
 * open ones first. The team answers by email and marks them as solved.
 */
class AdminProblemsController extends Controller
{
    use BuildsAdminArea;

    /** Solved ones still listed under the open ones. */
    private const SOLVED_LIMIT = 100;

    /** Minutes a link to a screenshot works. */
    private const SCREENSHOT_LINK_MINUTES = 10;

    public function __invoke(): Response
    {
        $open = ProblemReport::query()->open()->latest('id')->with('user')->get();
        $solved = ProblemReport::query()->whereNotNull('resolved_at')->latest('resolved_at')->limit(self::SOLVED_LIMIT)->with('user')->get();

        return Inertia::render('admin/problems', [
            'adminArea' => $this->adminArea(),
            'problems' => $open->concat($solved)->map(fn (ProblemReport $report) => [
                'id' => $report->id,
                'name' => $report->user->name,
                'email' => $report->user->email,
                'role' => $report->roleLabel(),
                'message' => $report->message,
                'page' => $report->page,
                'device' => $report->device,
                'viewport' => $report->viewport,
                'installed' => $report->installed,
                'screenshotUrl' => $report->screenshot_path !== null
                    ? URL::temporarySignedRoute('admin.problems.screenshot', now()->addMinutes(self::SCREENSHOT_LINK_MINUTES), ['report' => $report])
                    : null,
                'createdAt' => $report->created_at?->toIso8601ZuluString(),
                'solved' => $report->resolved_at !== null,
            ])->all(),
        ]);
    }

    public function solve(Request $request, ProblemReport $report): RedirectResponse
    {
        $report->forceFill(['resolved_at' => now(), 'resolved_by' => $request->user()?->id])->save();

        return back();
    }

    public function reopen(ProblemReport $report): RedirectResponse
    {
        $report->forceFill(['resolved_at' => null, 'resolved_by' => null])->save();

        return back();
    }

    public function screenshot(ProblemReport $report): StreamedResponse
    {
        abort_if($report->screenshot_path === null || ! Storage::disk(ProblemReport::DISK)->exists($report->screenshot_path), 404);

        return Storage::disk(ProblemReport::DISK)->response($report->screenshot_path, null, [
            'Cache-Control' => 'private, no-store',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
