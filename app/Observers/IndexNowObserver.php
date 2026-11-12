<?php

namespace App\Observers;

use App\Enums\GroupSessionStatus;
use App\Enums\TrainerProfileStatus;
use App\Models\GroupSession;
use App\Models\GymProfile;
use App\Models\TrainerProfile;
use App\Support\IndexNow;
use Illuminate\Database\Eloquent\Model;

/**
 * Sends the public page of a trainer, a gym or an event to IndexNow when what
 * search engines read changes: published, edited, hidden or removed. Not for
 * the fields the site updates by itself (first free slot, rating counters):
 * they would ping at every visit.
 */
class IndexNowObserver
{
    /** The fields of the public page, by model. */
    private const WATCHED = [
        TrainerProfile::class => ['status', 'visible_in_search', 'paused_at', 'slug', 'headline', 'bio', 'experience', 'city_id', 'price_from_cents'],
        GymProfile::class => ['status', 'visible_in_search', 'slug', 'name', 'description', 'city_id', 'address', 'opening_notes'],
        GroupSession::class => ['status', 'hidden_at', 'slug', 'title', 'description', 'starts_at', 'ends_at', 'place', 'address', 'price_cents', 'cancelled_at'],
    ];

    public function saved(Model $model): void
    {
        if (! IndexNow::enabled() || ! $model->wasChanged(self::WATCHED[$model::class] ?? [])) {
            return;
        }

        // Only pages that are or were public: never a profile still waiting for the team.
        if (! $this->wasEverPublic($model)) {
            return;
        }

        $url = match (true) {
            $model instanceof TrainerProfile => route('trainers.show', $model->slug),
            $model instanceof GymProfile => route('gyms.show', $model->slug),
            $model instanceof GroupSession => route('events.show', $model->slug),
            default => null,
        };

        if ($url !== null) {
            IndexNow::submit($url);
        }
    }

    private function wasEverPublic(Model $model): bool
    {
        if ($model instanceof GroupSession) {
            // The lessons of a gym course have no page of their own.
            return $model->gym_course_lesson_id === null && $model->status === GroupSessionStatus::Published
                || $model->getOriginal('status') === GroupSessionStatus::Published;
        }

        if ($model instanceof TrainerProfile || $model instanceof GymProfile) {
            return $model->status === TrainerProfileStatus::Approved
                || $model->getOriginal('status') === TrainerProfileStatus::Approved;
        }

        return false;
    }
}
