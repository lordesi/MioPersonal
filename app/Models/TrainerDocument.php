<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/**
 * A certification of the trainer. Title and issuer show up on the profile;
 * the file is on the private disk and only the team opens it.
 *
 * @property int $id
 * @property int $trainer_profile_id
 * @property string $type certificate (identity: not asked yet)
 * @property string $title
 * @property string|null $issuer
 * @property int|null $year
 * @property string|null $path
 * @property CarbonImmutable|null $verified_at
 * @property int $sort
 */
#[Fillable(['type', 'title', 'issuer', 'year', 'path', 'sort'])]
class TrainerDocument extends Model
{
    /** Private: never reachable from a public URL. */
    public const DISK = 'local';

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'verified_at' => 'datetime',
            'sort' => 'integer',
        ];
    }

    /** "Ente · 2020", as on the profile. */
    public function issuerLabel(): string
    {
        return implode(' · ', array_filter([$this->issuer, $this->year]));
    }
}
