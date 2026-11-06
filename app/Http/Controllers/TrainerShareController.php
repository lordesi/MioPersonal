<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\BuildsPlaceholderData;
use App\Models\TrainerProfile;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Condividi profilo": the link for the Instagram bio, the QR code and the
 * image for the stories, all drawn in the browser. Every link says where the
 * visit comes from (utm_*), so Admin · Statistiche shows what works. Only
 * for a profile in the search: before that the link leads nowhere.
 */
class TrainerShareController extends Controller
{
    use BuildsPlaceholderData;

    /** How many disciplines the story image shows. */
    private const DISCIPLINES = 3;

    public function __invoke(Request $request): Response
    {
        /** @var User $trainer */
        $trainer = $request->user();
        $profile = $trainer->trainerProfile;
        $shareable = $profile !== null && TrainerProfile::query()->published()->whereKey($profile->id)->exists();

        return Inertia::render('trainer/share', [
            'trainerArea' => $this->trainerArea(),
            'card' => $profile === null || ! $shareable ? null : [
                'name' => $trainer->name,
                'firstName' => $trainer->first_name,
                'headline' => $profile->headline,
                'city' => $profile->city->name ?? 'Online',
                'disciplines' => $profile->disciplines()->limit(self::DISCIPLINES)->pluck('name')->all(),
                'rating' => $profile->rating(),
                'reviewCount' => $profile->rating_count,
                // Same origin as the page: the browser can draw it on a canvas.
                'photoUrl' => $profile->portrait?->url(),
                'links' => [
                    'bio' => self::link($profile, 'bio'),
                    'qr' => self::link($profile, 'qr'),
                    'story' => self::link($profile, 'story'),
                ],
            ],
            // Not shareable: why ("review", "changes", "hidden"…).
            'reason' => $shareable ? null : $this->reason($profile),
        ]);
    }

    /** The public profile with utm_source=instagram and the place of the link. */
    public static function link(TrainerProfile $profile, string $medium): string
    {
        return route('trainers.show', [
            'slug' => $profile->slug,
            'utm_source' => 'instagram',
            'utm_medium' => $medium,
            'utm_campaign' => $profile->slug,
        ]);
    }

    private function reason(?TrainerProfile $profile): string
    {
        return match (true) {
            $profile === null => 'missing',
            ! $profile->isApproved() => 'review',
            default => 'hidden',
        };
    }
}
