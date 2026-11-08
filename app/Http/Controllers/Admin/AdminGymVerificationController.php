<?php

namespace App\Http\Controllers\Admin;

use App\Enums\GymAmenity;
use App\Enums\TrainerProfileStatus;
use App\Enums\TrainerReviewDecision;
use App\Http\Controllers\Admin\Concerns\BuildsAdminPlaceholderData;
use App\Http\Controllers\Controller;
use App\Models\GymAmenityDetail;
use App\Models\GymPhoto;
use App\Models\GymProfile;
use App\Models\User;
use App\Notifications\GymProfileDecided;
use App\Support\GymDraft;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Verifica palestre": the gyms waiting for the team, oldest first. Same flow
 * as "Verifica trainer" (AdminVerificationController), without certificates.
 */
class AdminGymVerificationController extends Controller
{
    use BuildsAdminPlaceholderData;

    /** How long a decided profile stays in the list. */
    private const DECIDED_HOURS = 24;

    public function __invoke(): Response
    {
        $profiles = GymProfile::query()
            ->with(['user', 'city', 'cover', 'galleryPhotos', 'openingHours', 'decisions', 'amenityDetails'])
            ->where(fn ($query) => $query
                ->whereIn('status', [TrainerProfileStatus::Review, TrainerProfileStatus::Changes])
                ->orWhere('status_changed_at', '>=', now()->subHours(self::DECIDED_HOURS)))
            ->orderBy('status_changed_at')
            ->get();

        return Inertia::render('admin/gym-verification', [
            'adminArea' => $this->adminArea(),
            'gyms' => $profiles->map(fn (GymProfile $profile) => $this->card($profile))->values()->all(),
        ]);
    }

    public function decide(Request $request, GymProfile $gym): RedirectResponse
    {
        $data = $request->validate([
            'decision' => ['required', Rule::enum(TrainerReviewDecision::class)],
            'reasons' => ['array'],
            'reasons.*' => ['string', 'max:100'],
            'message' => ['nullable', 'string', 'max:2000', 'required_if:decision,rejected'],
            'internal_note' => ['nullable', 'string', 'max:2000'],
        ], [
            'message.required_if' => 'Scrivi il motivo del rifiuto: la palestra lo riceve via email.',
        ]);

        $decision = TrainerReviewDecision::from($data['decision']);

        $allowed = $decision === TrainerReviewDecision::Undone
            ? $gym->status !== TrainerProfileStatus::Review
            : $gym->status === TrainerProfileStatus::Review;

        if (! $allowed) {
            return back()->withErrors(['decision' => 'Il profilo è cambiato nel frattempo: ricarica la pagina.']);
        }

        /** @var User $admin */
        $admin = $request->user();

        $review = DB::transaction(function () use ($gym, $decision, $data, $admin) {
            $review = $gym->decisions()->create([
                'admin_id' => $admin->id,
                'decision' => $decision,
                'reasons' => $decision === TrainerReviewDecision::Changes ? array_values($data['reasons'] ?? []) : null,
                'message_to_gym' => $data['message'] ?? null,
                'internal_note' => $data['internal_note'] ?? null,
            ]);

            $gym->forceFill([
                'status' => $decision->status(),
                'status_changed_at' => now(),
                'approved_at' => $decision === TrainerReviewDecision::Approved ? now() : $gym->approved_at,
            ])->save();

            return $review;
        });

        if ($decision !== TrainerReviewDecision::Undone) {
            $gym->user->notify(new GymProfileDecided($review, route('gyms.show', $gym->slug)));
        }

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    private function card(GymProfile $profile): array
    {
        $days = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
        $hours = [];

        foreach (GymDraft::hours($profile) as $index => $ranges) {
            $hours[] = $days[$index].' '.($ranges === []
                ? 'chiuso'
                : implode(', ', array_map(fn (array $range) => "{$range['opens']}–{$range['closes']}", $ranges)));
        }

        return [
            'id' => $profile->id,
            'name' => $profile->name,
            'owner' => $profile->user->name,
            'email' => $profile->user->email,
            'city' => $profile->city->name,
            'address' => $profile->fullAddress(),
            'status' => $profile->status->value,
            'statusSince' => $this->iso(CarbonImmutable::instance($profile->status_changed_at ?? $profile->created_at ?? now())),
            'description' => $profile->description,
            'amenities' => array_map(fn (string $value) => GymAmenity::tryFrom($value)?->label() ?? $value, $profile->amenities),
            'hours' => $hours,
            'coverUrl' => $profile->cover?->url(),
            // The photos of "Servizi" too: public like the gallery, to check the same way.
            'photos' => [
                ...$profile->galleryPhotos->map(fn (GymPhoto $photo) => $photo->url())->values()->all(),
                ...$profile->amenityDetails->map(fn (GymAmenityDetail $detail) => $detail->photoUrl())->filter()->values()->all(),
            ],
            // "Bagno turco: …": the descriptions written in "Servizi".
            'amenityNotes' => $profile->amenityDetails
                ->filter(fn (GymAmenityDetail $detail) => filled($detail->description))
                ->map(fn (GymAmenityDetail $detail) => $detail->amenity->label().': '.$detail->description)
                ->values()->all(),
            'contacts' => array_values(array_filter([
                $profile->phone, $profile->email, $profile->website,
                $profile->instagram === null ? null : '@'.$profile->instagram,
            ])),
            'warnings' => $this->warnings($profile),
            'internalNote' => $profile->decisions->first()?->internal_note,
            'profileHref' => route('gyms.show', $profile->slug, false),
        ];
    }

    /**
     * Automatic warnings: computed every time, never saved.
     *
     * @return list<string>
     */
    private function warnings(GymProfile $profile): array
    {
        $warnings = [];

        if ($profile->cover === null) {
            $warnings[] = 'Manca la foto di copertina';
        }

        if ($profile->galleryPhotos->isEmpty()) {
            $warnings[] = 'Nessuna foto nella galleria';
        }

        if ($profile->openingHours->isEmpty()) {
            $warnings[] = 'Orari di apertura non indicati';
        }

        if ($profile->phone === null && $profile->email === null && $profile->website === null) {
            $warnings[] = 'Nessun contatto pubblico';
        }

        return $warnings;
    }
}
