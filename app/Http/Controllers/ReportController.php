<?php

namespace App\Http\Controllers;

use App\Enums\ReportReason;
use App\Models\GymProfile;
use App\Models\Report;
use App\Models\Review;
use App\Models\TrainerProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

/**
 * "Segnala" on trainer profiles, gym profiles and reviews: the team sees the
 * report in "Admin · Segnalazioni". One open report per person and content:
 * reporting it again only updates the reason.
 */
class ReportController extends Controller
{
    public const TYPES = ['trainer', 'gym', 'review'];

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'type' => ['required', Rule::in(self::TYPES)],
            // The slug of a profile, the id of a review.
            'target' => ['required', 'string', 'max:255'],
            'reason' => ['required', Rule::enum(ReportReason::class)],
            'details' => ['nullable', 'string', 'max:500'],
        ]);

        /** @var User $user */
        $user = $request->user();
        $reportable = $this->find($data['type'], $data['target']);

        // Nobody reports their own profile, or a review of their own profile.
        if ($this->ownerId($reportable) === $user->id) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Non puoi segnalare il tuo profilo.']);

            return back();
        }

        $report = Report::query()
            ->open()
            ->where('reporter_id', $user->id)
            ->whereMorphedTo('reportable', $reportable)
            ->first() ?? new Report;

        $report->fill([
            'reason' => $data['reason'],
            'details' => isset($data['details']) ? trim($data['details']) ?: null : null,
        ]);
        $report->reporter()->associate($user);
        $report->reportable()->associate($reportable);
        $report->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Segnalazione inviata: il nostro team la controlla.']);

        return back();
    }

    /** Only what the public can see: approved profiles, reviews not hidden. */
    private function find(string $type, string $target): TrainerProfile|GymProfile|Review
    {
        return match ($type) {
            'trainer' => TrainerProfile::query()->approved()->where('slug', $target)->firstOrFail(),
            'gym' => GymProfile::query()->approved()->where('slug', $target)->firstOrFail(),
            default => Review::query()->notHidden()->whereKey((int) $target)->firstOrFail(),
        };
    }

    private function ownerId(Model $reportable): ?int
    {
        return match (true) {
            $reportable instanceof Review => $reportable->trainerProfile->user_id,
            $reportable instanceof TrainerProfile, $reportable instanceof GymProfile => $reportable->user_id,
            default => null,
        };
    }
}
