<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A message of "Messaggi": text, a PDF ("la scheda"), a photo, or text with
 * one of them. The files last ATTACHMENT_DAYS, then messages:expire-attachments
 * deletes them and empties the path: the text and the name stay.
 *
 * @property int $id
 * @property int $conversation_id
 * @property int $sender_id
 * @property string|null $body
 * @property string|null $attachment_kind 'pdf' or 'photo'
 * @property string|null $attachment_path null once expired
 * @property string|null $attachment_name
 * @property int|null $attachment_size bytes
 * @property int|null $attachment_width px, photos only
 * @property int|null $attachment_height px, photos only
 * @property CarbonImmutable|null $created_at
 * @property-read Conversation $conversation
 * @property-read User $sender
 */
#[Fillable(['sender_id', 'body', 'attachment_kind', 'attachment_path', 'attachment_name', 'attachment_size', 'attachment_width', 'attachment_height'])]
class Message extends Model
{
    public const UPDATED_AT = null;

    /** Private: the files are served through MessagesController@download and @photo. */
    public const DISK = 'local';

    public const BODY_MAX = 2000;

    public const ATTACHMENT_MAX_KB = 10240;

    public const PHOTO_MAX_KB = 10240;

    /** The PDFs and the photos are deleted after these many days. */
    public const ATTACHMENT_DAYS = 10;

    public const KIND_PDF = 'pdf';

    public const KIND_PHOTO = 'photo';

    /** Sent and returned by the poll at most at once. */
    public const PAGE = 50;

    public function isPhoto(): bool
    {
        return $this->attachment_kind === self::KIND_PHOTO;
    }

    public function attachmentExpiresAt(): ?CarbonImmutable
    {
        return $this->attachment_kind === null || $this->created_at === null
            ? null
            : $this->created_at->addDays(self::ATTACHMENT_DAYS);
    }

    /** There was a file, and it has been deleted. */
    public function attachmentExpired(): bool
    {
        return $this->attachment_kind !== null && $this->attachment_path === null;
    }

    /**
     * @return BelongsTo<Conversation, $this>
     */
    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }
}
