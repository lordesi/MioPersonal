<?php

namespace App\Models;

use App\Enums\SocialProvider;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A social account linked by the trainer with OAuth: public, as an icon on
 * the profile. Only who the account is: no token is kept.
 *
 * @property int $id
 * @property int $trainer_profile_id
 * @property SocialProvider $provider
 * @property string $provider_user_id the id of the account on the social
 * @property string $handle the username, without "@"
 * @property string $url the public page of the account
 * @property CarbonImmutable $connected_at
 * @property-read TrainerProfile $trainerProfile
 */
#[Fillable(['provider', 'provider_user_id', 'handle', 'url', 'connected_at'])]
class TrainerSocialAccount extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'provider' => SocialProvider::class,
            'connected_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<TrainerProfile, $this>
     */
    public function trainerProfile(): BelongsTo
    {
        return $this->belongsTo(TrainerProfile::class);
    }
}
