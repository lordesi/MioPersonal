<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * The Google event written for a session (booking) or an event (group
 * session) on a trainer's calendar.
 *
 * @property int $id
 * @property int $trainer_calendar_connection_id
 * @property int|null $booking_id
 * @property int|null $group_session_id
 * @property string $google_event_id
 * @property-read TrainerCalendarConnection $connection
 */
#[Fillable(['booking_id', 'group_session_id', 'google_event_id'])]
class CalendarEvent extends Model
{
    /**
     * @return BelongsTo<TrainerCalendarConnection, $this>
     */
    public function connection(): BelongsTo
    {
        return $this->belongsTo(TrainerCalendarConnection::class, 'trainer_calendar_connection_id');
    }

    /**
     * @return BelongsTo<Booking, $this>
     */
    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    /**
     * @return BelongsTo<GroupSession, $this>
     */
    public function groupSession(): BelongsTo
    {
        return $this->belongsTo(GroupSession::class);
    }
}
