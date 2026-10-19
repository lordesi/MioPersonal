<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\BuildsPlaceholderData;
use App\Models\Review;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Recensioni" of the trainer: the clients' reviews, the newest first, and
 * the public reply to each one. The ones hidden by the team are not here.
 */
class TrainerReviewsController extends Controller
{
    use BuildsPlaceholderData;

    /** Longest reply, in characters. */
    public const REPLY_MAX = 1000;

    public function show(Request $request): Response
    {
        /** @var User $trainer */
        $trainer = $request->user();
        $profile = $trainer->trainerProfile;

        return Inertia::render('trainer/reviews', [
            'trainerArea' => $this->trainerArea(),
            // average null = no reviews yet.
            'summary' => ['average' => $profile?->rating(), 'count' => $profile->rating_count ?? 0],
            'reviews' => $profile === null ? [] : $profile->reviews()
                ->notHidden()
                ->with(['client', 'booking'])
                ->latest()
                ->latest('id')
                ->get()
                ->map(fn (Review $review) => [
                    'id' => $review->id,
                    // The trainer sees first and last name; anonymous once the account is deleted.
                    'authorName' => $review->client->name ?? 'Utente anonimo',
                    'rating' => $review->rating,
                    // The booked service; none for the demo reviews.
                    'serviceName' => $review->booking?->service_name,
                    'date' => $this->iso($review->created_at ?? now()->toImmutable()),
                    'text' => $review->text,
                    'reply' => $review->reply,
                ])
                ->all(),
        ]);
    }

    /** "Pubblica risposta": shown on the public profile under the review, once. */
    public function reply(Request $request, Review $review): RedirectResponse
    {
        /** @var User $trainer */
        $trainer = $request->user();

        // Another trainer's review, or hidden by the team: as if it didn't exist.
        abort_unless($review->trainer_profile_id === $trainer->trainerProfile?->id && $review->hidden_at === null, 404);

        $data = $request->validate([
            'reply' => ['required', 'string', 'max:'.self::REPLY_MAX],
        ], [
            'reply.required' => 'Scrivi la risposta.',
            'reply.max' => 'La risposta può avere al massimo '.self::REPLY_MAX.' caratteri.',
        ]);

        if ($review->reply !== null) {
            throw ValidationException::withMessages(['reply' => 'Hai già risposto a questa recensione.']);
        }

        $review->forceFill(['reply' => trim($data['reply']), 'replied_at' => now()])->save();

        return back();
    }
}
