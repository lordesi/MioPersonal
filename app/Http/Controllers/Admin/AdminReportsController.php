<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\BuildsAdminArea;
use App\Http\Controllers\Controller;
use App\Models\AdminActivity;
use App\Models\GymProfile;
use App\Models\Report;
use App\Models\Review;
use App\Models\TrainerProfile;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Segnalazioni": what users reported with "Segnala", the open ones first.
 * "Rimuovi" hides a reported review; a reported profile is handled from
 * "Utenti" (suspend, close the profile), then the report is marked as done.
 * "Ignora": nothing wrong. Either way every open report of the same content
 * is closed together.
 */
class AdminReportsController extends Controller
{
    use BuildsAdminArea;

    /** The closed reports still listed under the open ones. */
    private const CLOSED_LIMIT = 50;

    public function __invoke(): Response
    {
        $open = Report::query()->open()->oldest('id')->get();
        $closed = Report::query()->whereNotNull('resolved_at')->latest('resolved_at')->limit(self::CLOSED_LIMIT)->get();
        $reports = $open->concat($closed)
            ->load('reporter')
            ->loadMorph('reportable', [
                TrainerProfile::class => ['user'],
                GymProfile::class => ['user'],
                Review::class => ['trainerProfile.user', 'client'],
            ]);

        return Inertia::render('admin/reports', [
            'adminArea' => $this->adminArea(),
            'reports' => $reports->map(fn (Report $report) => $this->row($report))->all(),
        ]);
    }

    public function resolve(Request $request, Report $report): RedirectResponse
    {
        $data = $request->validate([
            'resolution' => ['required', Rule::in([Report::REMOVED, Report::DISMISSED])],
        ]);

        $reportable = $report->reportable;

        if ($data['resolution'] === Report::REMOVED && $reportable instanceof Review && $reportable->hidden_at === null) {
            $reportable->forceFill(['hidden_at' => now(), 'hidden_by' => $request->user()?->id])->save();
            $reportable->trainerProfile->refreshRating();
        }

        Report::query()
            ->open()
            ->where('reportable_type', $report->reportable_type)
            ->where('reportable_id', $report->reportable_id)
            ->update([
                'resolved_at' => now(),
                'resolved_by' => $request->user()?->id,
                'resolution' => $data['resolution'],
            ]);

        $title = $this->subject($reportable)['title'];
        AdminActivity::log(
            $data['resolution'] === Report::REMOVED ? 'report.removed' : 'report.dismissed',
            $report,
            $data['resolution'] === Report::REMOVED
                ? ($reportable instanceof Review ? "Segnalazione chiusa, recensione nascosta: {$title}" : "Segnalazione gestita: {$title}")
                : "Segnalazione ignorata: {$title}",
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => $data['resolution'] === Report::REMOVED ? 'Segnalazione chiusa.' : 'Segnalazione ignorata.']);

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    private function row(Report $report): array
    {
        $reportable = $report->reportable;

        return [
            'id' => $report->id,
            'reason' => $report->reason->label(),
            'details' => $report->details,
            'reporterName' => $report->reporter->name ?? 'Utente eliminato',
            'createdAt' => $report->created_at?->toIso8601ZuluString(),
            'resolution' => $report->resolution,
            'resolvedAt' => $report->resolved_at?->toIso8601ZuluString(),
            'subject' => $this->subject($reportable),
        ];
    }

    /**
     * What was reported, with the links the team needs.
     *
     * @return array{kind: string, title: string, text: string|null, href: string|null, ownerEmail: string|null, hidden: bool}
     */
    private function subject(mixed $reportable): array
    {
        return match (true) {
            $reportable instanceof TrainerProfile => [
                'kind' => 'trainer',
                'title' => $reportable->user->name,
                'text' => null,
                'href' => route('trainers.show', $reportable->slug, false),
                'ownerEmail' => $reportable->user->email,
                'hidden' => false,
            ],
            $reportable instanceof GymProfile => [
                'kind' => 'gym',
                'title' => $reportable->name,
                'text' => null,
                'href' => route('gyms.show', $reportable->slug, false),
                'ownerEmail' => $reportable->user->email,
                'hidden' => false,
            ],
            $reportable instanceof Review => [
                'kind' => 'review',
                'title' => ($reportable->client->name ?? 'Utente anonimo').' su '.$reportable->trainerProfile->user->name,
                'text' => $reportable->text,
                'href' => route('trainers.show', $reportable->trainerProfile->slug, false).'#recensioni',
                'ownerEmail' => null,
                'hidden' => $reportable->hidden_at !== null,
            ],
            // The content was deleted in the meantime.
            default => ['kind' => 'deleted', 'title' => 'Contenuto eliminato', 'text' => null, 'href' => null, 'ownerEmail' => null, 'hidden' => true],
        };
    }
}
