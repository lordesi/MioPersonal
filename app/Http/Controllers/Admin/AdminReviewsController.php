<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\BuildsAdminPlaceholderData;
use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Recensioni": the reviews of the platform, the newest first, with a warning
 * when the text has contacts in it. "Nascondi" takes a review off the profile
 * and the average; "Mostra di nuovo" puts it back.
 *
 * TODO: record hide and show in admin_activity_log (step 7 of docs/database/analisi.md).
 */
class AdminReviewsController extends Controller
{
    use BuildsAdminPlaceholderData;

    /** Enough for the beta. */
    private const LIMIT = 200;

    public function __invoke(): Response
    {
        $reviews = Review::query()
            ->with(['client', 'trainerProfile.user'])
            ->latest('id')
            ->limit(self::LIMIT)
            ->get();

        return Inertia::render('admin/reviews', [
            'adminArea' => $this->adminArea(),
            'reviews' => $reviews->map(fn (Review $review) => [
                'id' => $review->id,
                'authorName' => $review->client->name ?? 'Utente anonimo',
                'trainerName' => $review->trainerProfile->user->name,
                'rating' => $review->rating,
                'text' => $review->text,
                'createdAt' => $review->created_at?->toIso8601ZuluString(),
                'warning' => $review->flag_reason ?? self::warning($review->text),
                'hidden' => $review->hidden_at !== null,
            ])->all(),
        ]);
    }

    public function hide(Request $request, Review $review): RedirectResponse
    {
        $review->forceFill(['hidden_at' => now(), 'hidden_by' => $request->user()?->id])->save();
        $review->trainerProfile->refreshRating();

        return back();
    }

    public function show(Review $review): RedirectResponse
    {
        $review->forceFill(['hidden_at' => null, 'hidden_by' => null])->save();
        $review->trainerProfile->refreshRating();

        return back();
    }

    /**
     * Contacts are not allowed in reviews: a phone number (8 digits or more,
     * spaces allowed), an email address or a link.
     */
    private static function warning(string $text): ?string
    {
        return match (true) {
            preg_match('/(?:\+?\d[\s.\-\/]?){8,}/', $text) === 1 => 'Contiene un numero di telefono',
            preg_match('/[^\s@]+@[^\s@]+\.[a-z]{2,}/i', $text) === 1 => 'Contiene un indirizzo email',
            preg_match('/https?:\/\/|www\.|\b[a-z0-9-]+\.(?:it|com|net|org)\b/i', $text) === 1 => 'Contiene un link',
            default => null,
        };
    }
}
