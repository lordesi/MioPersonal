<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Http\Controllers\Concerns\BuildsPlaceholderData;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\TrainerClient;
use App\Models\User;
use App\Support\ClientBookingData;
use App\Support\SafeImage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * "Messaggi": a trainer and their registered clients (trainer_clients with
 * an account) write to each other, with photos and PDFs that last
 * Message::ATTACHMENT_DAYS. No sockets: the open conversation asks for the
 * new messages every few seconds (poll), the list every 20.
 */
class MessagesController extends Controller
{
    use BuildsPlaceholderData;

    /** The poll gives at most these many messages at once. */
    public const POLL_MAX = 100;

    /** "Messaggi" of the trainer area or of the client area; "?con=12" opens a conversation. */
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $trainer = $user->role === UserRole::Trainer;
        $records = $this->records($user);
        $selected = $records->firstWhere('id', $request->integer('con'));

        return Inertia::render($trainer ? 'trainer/messages' : 'client/messages', [
            ...($trainer ? ['trainerArea' => $this->trainerArea()] : []),
            'conversations' => fn () => $records->map(fn (TrainerClient $record) => $this->summary($record, $user))->values()->all(),
            'selected' => fn () => $selected === null ? null : $this->thread($selected, $user),
        ]);
    }

    /** The messages after `?after=`, oldest first. Marks the conversation as read. */
    public function poll(Request $request, TrainerClient $record): JsonResponse
    {
        $user = $this->authorizeRecord($request, $record);
        $conversation = $record->conversation;

        if ($conversation === null) {
            return response()->json(['messages' => []]);
        }

        $conversation->setRelation('trainerClient', $record);
        $messages = $conversation->messages()
            ->where('id', '>', $request->integer('after'))
            ->orderBy('id')
            ->limit(self::POLL_MAX)
            ->get();

        if ($conversation->unreadFor($user)) {
            $conversation->markReadBy($user);
        }

        return response()->json([
            'messages' => $messages->map(fn (Message $message) => $this->message($message, $record, $user))->all(),
            'otherReadAt' => $this->otherReadAt($conversation, $user),
        ]);
    }

    /** "Messaggi precedenti": the page before `?before=`, oldest first. */
    public function older(Request $request, TrainerClient $record): JsonResponse
    {
        $user = $this->authorizeRecord($request, $record);
        $conversation = $record->conversation;

        if ($conversation === null) {
            return response()->json(['messages' => [], 'hasOlder' => false]);
        }

        $messages = $conversation->messages()
            ->where('id', '<', $request->integer('before'))
            ->orderByDesc('id')
            ->limit(Message::PAGE + 1)
            ->get();

        return response()->json([
            'messages' => $messages->take(Message::PAGE)->reverse()->map(fn (Message $message) => $this->message($message, $record, $user))->values()->all(),
            'hasOlder' => $messages->count() > Message::PAGE,
        ]);
    }

    /** Text, a PDF, a photo, or text with one of them. The conversation is made with the first message. */
    public function store(Request $request, TrainerClient $record): JsonResponse
    {
        $user = $this->authorizeRecord($request, $record);

        $data = $request->validate([
            'body' => ['nullable', 'string', 'max:'.Message::BODY_MAX, 'required_without_all:attachment,photo'],
            'attachment' => ['nullable', 'file', 'mimes:pdf', 'max:'.Message::ATTACHMENT_MAX_KB],
            'photo' => ['nullable', 'prohibits:attachment', 'image', 'mimes:jpg,jpeg,png', 'max:'.Message::PHOTO_MAX_KB],
        ], [
            'body.required_without_all' => 'Scrivi un messaggio o allega una foto o un PDF.',
            'body.max' => 'Il messaggio può avere al massimo '.Message::BODY_MAX.' caratteri.',
            'attachment.mimes' => 'Puoi allegare solo file PDF.',
            'attachment.max' => 'Il PDF può pesare al massimo '.intdiv(Message::ATTACHMENT_MAX_KB, 1024).' MB.',
            'photo.prohibits' => 'Manda la foto e il PDF in due messaggi.',
            'photo.image' => 'La foto deve essere un\'immagine JPG o PNG.',
            'photo.mimes' => 'La foto deve essere un\'immagine JPG o PNG.',
            'photo.max' => 'La foto può pesare al massimo '.intdiv(Message::PHOTO_MAX_KB, 1024).' MB.',
            'photo.uploaded' => 'Non siamo riusciti a caricare la foto: riprova.',
        ]);

        /** @var UploadedFile|null $pdf */
        $pdf = $data['attachment'] ?? null;
        /** @var UploadedFile|null $photo */
        $photo = $data['photo'] ?? null;
        /** @var string|null $body */
        $body = $data['body'] ?? null;
        $written = null;

        try {
            $message = DB::transaction(function () use ($record, $user, $body, $pdf, $photo, &$written) {
                $conversation = Conversation::query()->firstOrCreate(['trainer_client_id' => $record->id]);
                $conversation->setRelation('trainerClient', $record);
                $attachment = [];

                if ($pdf !== null) {
                    $written = $pdf->storeAs($conversation->folder(), Str::uuid().'.pdf', Message::DISK) ?: null;
                    $attachment = [
                        'attachment_kind' => Message::KIND_PDF,
                        'attachment_path' => $written,
                        'attachment_name' => $this->fileName($pdf),
                        'attachment_size' => $pdf->getSize(),
                    ];
                } elseif ($photo !== null) {
                    $written = SafeImage::store($photo, $conversation->folder(), Message::DISK);
                    $contents = (string) Storage::disk(Message::DISK)->get($written);
                    $size = @getimagesizefromstring($contents) ?: [null, null];
                    $attachment = [
                        'attachment_kind' => Message::KIND_PHOTO,
                        'attachment_path' => $written,
                        'attachment_name' => $this->photoName($written),
                        'attachment_size' => strlen($contents),
                        'attachment_width' => $size[0],
                        'attachment_height' => $size[1],
                    ];
                }

                /** @var Message $message */
                $message = $conversation->messages()->create([
                    'sender_id' => $user->id,
                    'body' => $body,
                    ...$attachment,
                ]);

                $conversation->forceFill([
                    'last_message_at' => $message->created_at,
                    $conversation->isTrainer($user) ? 'trainer_read_at' : 'client_read_at' => $message->created_at,
                ])->save();

                return $message;
            });
        } catch (\Throwable $exception) {
            if ($written !== null) {
                Storage::disk(Message::DISK)->delete($written);
            }

            if ($exception instanceof \RuntimeException && $photo !== null && $written === null) {
                throw ValidationException::withMessages(['photo' => 'Non siamo riusciti a leggere la foto: prova con un\'altra.']);
            }

            throw $exception;
        }

        return response()->json(['message' => $this->message($message, $record, $user)], 201);
    }

    /** The PDF or the photo of a message, with the name it was sent with. */
    public function download(Request $request, TrainerClient $record, Message $message): StreamedResponse
    {
        $this->authorizeFile($request, $record, $message);

        return Storage::disk(Message::DISK)->download(
            (string) $message->attachment_path,
            $message->attachment_name ?? ($message->isPhoto() ? 'foto.jpg' : 'scheda.pdf'),
        );
    }

    /** The photo shown in the bubble. The file never changes: cached by the browser. */
    public function photo(Request $request, TrainerClient $record, Message $message): StreamedResponse
    {
        $this->authorizeFile($request, $record, $message);
        abort_unless($message->isPhoto(), 404);

        return Storage::disk(Message::DISK)->response((string) $message->attachment_path, null, [
            'Cache-Control' => 'private, max-age='.(Message::ATTACHMENT_DAYS * 86400),
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    /** A file of this conversation, not expired yet. */
    private function authorizeFile(Request $request, TrainerClient $record, Message $message): void
    {
        $this->authorizeRecord($request, $record);
        abort_unless($message->conversation_id === $record->conversation?->id && $message->attachment_path !== null, 404);
    }

    /** Only the two people of the conversation: the trainer and the client with an account. */
    private function authorizeRecord(Request $request, TrainerClient $record): User
    {
        /** @var User $user */
        $user = $request->user();

        abort_unless(
            $record->user_id !== null
                && ($record->user_id === $user->id || $record->trainerProfile->user_id === $user->id),
            404,
        );

        return $user;
    }

    /**
     * Who the user can write to: the latest conversation first, then by name.
     *
     * @return Collection<int, TrainerClient>
     */
    private function records(User $user): Collection
    {
        $query = TrainerClient::query()
            ->whereNotNull('user_id')
            ->with(['user', 'trainerProfile.user', 'conversation.latestMessage']);

        if ($user->role === UserRole::Trainer) {
            $query->where('trainer_profile_id', $user->trainerProfile->id ?? 0);
        } else {
            $query->where('user_id', $user->id);
        }

        return $query->get()
            ->sort(function (TrainerClient $a, TrainerClient $b) use ($user) {
                $last = ($b->conversation?->last_message_at?->getTimestamp() ?? 0) <=> ($a->conversation?->last_message_at?->getTimestamp() ?? 0);

                return $last !== 0 ? $last : strcasecmp($this->other($a, $user)->name, $this->other($b, $user)->name);
            })
            ->values()
            ->toBase();
    }

    /** The other person: the client for the trainer, the trainer for the client. */
    private function other(TrainerClient $record, User $user): User
    {
        /** @var User */
        return $record->user_id === $user->id ? $record->trainerProfile->user : $record->user;
    }

    /**
     * A row of the list.
     *
     * @return array<string, mixed>
     */
    private function summary(TrainerClient $record, User $user): array
    {
        $other = $this->other($record, $user);
        $conversation = $record->conversation;
        $conversation?->setRelation('trainerClient', $record);
        $last = $conversation?->latestMessage;

        return [
            'recordId' => $record->id,
            'name' => $other->name,
            'avatar' => $other->avatar,
            'lastMessage' => $last === null ? null : [
                'mine' => $last->sender_id === $user->id,
                'text' => $last->body ?? ($last->isPhoto() ? 'Foto' : $last->attachment_name ?? ''),
                // The icon before the text: only when there is no text.
                'attachment' => $last->body === null ? $last->attachment_kind : null,
                'at' => $last->created_at === null ? null : ClientBookingData::iso($last->created_at),
            ],
            'unread' => $conversation?->unreadFor($user) ?? false,
        ];
    }

    /**
     * The open conversation: the last messages, then marked as read.
     *
     * @return array<string, mixed>
     */
    private function thread(TrainerClient $record, User $user): array
    {
        $other = $this->other($record, $user);
        $conversation = $record->conversation;
        $messages = collect();

        if ($conversation !== null) {
            $conversation->setRelation('trainerClient', $record);
            $messages = $conversation->messages()->orderByDesc('id')->limit(Message::PAGE + 1)->get();

            if ($conversation->unreadFor($user)) {
                $conversation->markReadBy($user);
            }
        }

        return [
            'recordId' => $record->id,
            'name' => $other->name,
            'avatar' => $other->avatar,
            // The client opens the trainer's public profile, the trainer the card in "Clienti".
            'href' => $record->user_id === $user->id
                ? route('trainers.show', $record->trainerProfile->slug, false)
                : route('trainer.clients', ['cliente' => $record->user_id], false),
            'subtitle' => $record->user_id === $user->id ? 'Il tuo personal trainer' : 'Cliente',
            'messages' => $messages->take(Message::PAGE)->reverse()->map(fn (Message $message) => $this->message($message, $record, $user))->values()->all(),
            'hasOlder' => $messages->count() > Message::PAGE,
            'otherReadAt' => $conversation === null ? null : $this->otherReadAt($conversation, $user),
        ];
    }

    /** When the other person last opened the conversation: "Visto" under my messages. */
    private function otherReadAt(Conversation $conversation, User $user): ?string
    {
        $read = $conversation->isTrainer($user) ? $conversation->client_read_at : $conversation->trainer_read_at;

        return $read === null ? null : ClientBookingData::iso($read);
    }

    /**
     * @return array<string, mixed>
     */
    private function message(Message $message, TrainerClient $record, User $user): array
    {
        $expired = $message->attachmentExpired();
        $keys = ['record' => $record->id, 'message' => $message->id];
        $expiresAt = $message->attachmentExpiresAt();

        return [
            'id' => $message->id,
            'mine' => $message->sender_id === $user->id,
            'body' => $message->body,
            'attachment' => $message->attachment_kind === null ? null : [
                'kind' => $message->attachment_kind,
                'name' => $message->attachment_name,
                'size' => $message->attachment_size,
                'href' => $expired ? null : route('messages.download', $keys, false),
                'src' => $expired || ! $message->isPhoto() ? null : route('messages.photo', $keys, false),
                'width' => $message->attachment_width,
                'height' => $message->attachment_height,
                'expiresAt' => $expiresAt === null ? null : ClientBookingData::iso($expiresAt),
                'expired' => $expired,
            ],
            'at' => $message->created_at === null ? null : ClientBookingData::iso($message->created_at),
        ];
    }

    /** "Foto 12-11-2026 14.05.jpg": the name of the download. */
    private function photoName(string $path): string
    {
        return 'Foto '.now()->timezone('Europe/Rome')->format('d-m-Y H.i').'.'.pathinfo($path, PATHINFO_EXTENSION);
    }

    /** "Scheda marzo.pdf": the name as sent, without folders, always ending in .pdf. */
    private function fileName(UploadedFile $file): string
    {
        $name = Str::limit(trim(basename($file->getClientOriginalName())), 120, '');
        $name = $name === '' ? 'scheda' : $name;

        return Str::endsWith(Str::lower($name), '.pdf') ? $name : "{$name}.pdf";
    }
}
