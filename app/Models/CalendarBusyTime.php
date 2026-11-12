<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A time the trainer is busy on their Google calendars ("Blocca gli orari
 * occupati"): only the start and the end, never what it is. Replaced at each
 * read; see App\Actions\Calendar\SyncBusyTimes.
 *
 * @property int $id
 * @property int $trainer_calendar_connection_id
 * @property CarbonImmutable $starts_at
 * @property CarbonImmutable $ends_at
 * @property-read TrainerCalendarConnection $connection
 */
#[Fillable(['starts_at', 'ends_at'])]
class CalendarBusyTime extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<TrainerCalendarConnection, $this>
     */
    public function connection(): BelongsTo
    {
        return $this->belongsTo(TrainerCalendarConnection::class, 'trainer_calendar_connection_id');
    }
}
