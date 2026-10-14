<?php

namespace App\Http\Controllers\Admin;

use App\Enums\PlaceType;
use App\Enums\TrainerProfileStatus;
use App\Enums\TrainerReviewDecision;
use App\Http\Controllers\Admin\Concerns\BuildsAdminPlaceholderData;
use App\Http\Controllers\Controller;
use App\Models\TrainerDocument;
use App\Models\TrainerPlace;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Notifications\TrainerProfileDecided;
use App\Support\TrainerSlots;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * "Verifica trainer": the profiles waiting for the team, oldest first. The
 * ones decided in the last 24 hours stay in the list, so "Annulla decisione"
 * works after a reload too.
 *
 * TODO: record the decisions in admin_activity_log (step 7 of docs/database/analisi.md).
 */
class AdminVerificationController extends Controller
{
    use BuildsAdminPlaceholderData;

    /** How long a decided profile stays in the list. */
    private const DECIDED_HOURS = 24;

    /** Minutes a link to a certificate works. */
    private const CERTIFICATE_LINK_MINUTES = 10;

    public function __invoke(): Response
    {
        $profiles = TrainerProfile::query()
            ->with(['user', 'city', 'disciplines', 'places', 'services', 'workingHours', 'documents', 'portrait', 'decisions'])
            ->where(fn ($query) => $query
                ->whereIn('status', [TrainerProfileStatus::Review, TrainerProfileStatus::Changes])
                ->orWhere('status_changed_at', '>=', now()->subHours(self::DECIDED_HOURS)))
            ->orderBy('status_changed_at')
            ->get();

        return Inertia::render('admin/verification', [
            'adminArea' => $this->adminArea(),
            'trainers' => $profiles->map(fn (TrainerProfile $profile) => $this->card($profile))->values()->all(),
        ]);
    }

    /** "Approva e pubblica", "Chiedi modifiche", "Rifiuta" and "Annulla decisione". */
    public function decide(Request $request, TrainerProfile $profile): RedirectResponse
    {
        $data = $request->validate([
            'decision' => ['required', Rule::enum(TrainerReviewDecision::class)],
            'reasons' => ['array'],
            'reasons.*' => ['string', 'max:100'],
            'message' => ['nullable', 'string', 'max:2000', 'required_if:decision,rejected'],
            'internal_note' => ['nullable', 'string', 'max:2000'],
        ], [
            'message.required_if' => 'Scrivi il motivo del rifiuto: il trainer lo riceve via email.',
        ]);

        $decision = TrainerReviewDecision::from($data['decision']);

        // Only a decided profile can be undone; only one waiting can be decided.
        $allowed = $decision === TrainerReviewDecision::Undone
            ? $profile->status !== TrainerProfileStatus::Review
            : $profile->status === TrainerProfileStatus::Review;

        if (! $allowed) {
            return back()->withErrors(['decision' => 'Il profilo è cambiato nel frattempo: ricarica la pagina.']);
        }

        /** @var User $admin */
        $admin = $request->user();

        $review = DB::transaction(function () use ($profile, $decision, $data, $admin) {
            $review = $profile->decisions()->create([
                'admin_id' => $admin->id,
                'decision' => $decision,
                'reasons' => $decision === TrainerReviewDecision::Changes ? array_values($data['reasons'] ?? []) : null,
                'message_to_trainer' => $data['message'] ?? null,
                'internal_note' => $data['internal_note'] ?? null,
            ]);

            $profile->forceFill([
                'status' => $decision->status(),
                'status_changed_at' => now(),
                'approved_at' => $decision === TrainerReviewDecision::Approved ? now() : $profile->approved_at,
            ])->save();

            if (in_array($decision, [TrainerReviewDecision::Approved, TrainerReviewDecision::Rejected], true)) {
                $this->deleteCertificateFiles($profile, $decision === TrainerReviewDecision::Approved);
            }

            return $review;
        });

        // The slot saved when the profile was sent may be old by now.
        if ($decision === TrainerReviewDecision::Approved) {
            TrainerSlots::refresh($profile->load('workingHours'));
        }

        if ($decision !== TrainerReviewDecision::Undone) {
            $profile->user->notify(new TrainerProfileDecided($review, route('trainers.show', $profile->slug)));
        }

        return back();
    }

    /** "Apri attestato": only with the temporary signed link of the page. */
    public function certificate(TrainerDocument $document): StreamedResponse
    {
        abort_if($document->path === null || ! Storage::disk(TrainerDocument::DISK)->exists($document->path), 404);

        return Storage::disk(TrainerDocument::DISK)->response($document->path);
    }

    /**
     * After the decision the files go, as the privacy policy says. Title and
     * issuer stay on the profile; approved certifications are marked verified.
     */
    private function deleteCertificateFiles(TrainerProfile $profile, bool $verified): void
    {
        $documents = $profile->documents()->where('type', 'certificate')->get();
        $paths = $documents->pluck('path')->filter()->values()->all();

        $profile->documents()->where('type', 'certificate')->update([
            'path' => null,
            'verified_at' => $verified ? now() : null,
        ]);

        DB::afterCommit(fn () => Storage::disk(TrainerDocument::DISK)->delete($paths));
    }

    /**
     * @return array<string, mixed>
     */
    private function card(TrainerProfile $profile): array
    {
        $certificates = $profile->documents->where('type', 'certificate');

        return [
            'id' => $profile->id,
            'name' => $profile->user->name,
            'disciplines' => $profile->disciplines->pluck('name')->all(),
            'city' => $profile->city->name ?? 'Solo online',
            'status' => $profile->status->value,
            // When the profile was sent, or when the team decided.
            'statusSince' => $this->iso(CarbonImmutable::instance($profile->status_changed_at ?? $profile->created_at ?? now())),
            'bio' => $profile->bio,
            'places' => $profile->places->map(fn (TrainerPlace $place) => $place->type === PlaceType::Studio
                ? "{$place->name}, {$place->address}"
                : $place->type->label())->all(),
            'services' => $profile->services->map(fn ($service) => [
                'label' => "{$service->name} · {$service->minutes} min",
                'priceCents' => $service->price_cents,
            ])->all(),
            'weeklyHours' => $profile->workingHours->sum(fn ($range) => count($range->startHours())),
            'hasIdentityDocument' => false,
            'certifications' => $certificates->map(fn (TrainerDocument $document) => [
                'id' => $document->id,
                'title' => $document->title,
                'issuer' => $document->issuerLabel(),
                'fileHref' => $document->path === null ? null : URL::temporarySignedRoute(
                    'admin.verification.certificate',
                    now()->addMinutes(self::CERTIFICATE_LINK_MINUTES),
                    ['document' => $document],
                ),
            ])->values()->all(),
            'warnings' => $this->warnings($profile),
            'internalNote' => $profile->decisions->first()?->internal_note,
            'profileHref' => route('trainers.show', $profile->slug, false),
        ];
    }

    /**
     * Automatic warnings: computed every time, never saved.
     *
     * @return list<string>
     */
    private function warnings(TrainerProfile $profile): array
    {
        $warnings = [];

        if (preg_match('/\d[\d .]{7,}\d/', $profile->bio) === 1) {
            $warnings[] = 'La bio contiene un numero di telefono';
        }

        if (preg_match('/[^\s@]+@[^\s@]+\.[a-z]{2,}/i', $profile->bio) === 1) {
            $warnings[] = 'La bio contiene un indirizzo email';
        }

        if (preg_match('/https?:\/\/|www\./i', $profile->bio) === 1) {
            $warnings[] = 'La bio contiene un link';
        }

        if ($profile->portrait === null) {
            $warnings[] = 'Manca la foto profilo';
        }

        $certificates = $profile->documents->where('type', 'certificate');

        if ($profile->status !== TrainerProfileStatus::Approved && $certificates->whereNotNull('path')->isEmpty()) {
            $warnings[] = 'Nessun attestato caricato';
        }

        return $warnings;
    }
}
