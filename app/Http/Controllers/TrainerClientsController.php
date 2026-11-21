<?php

namespace App\Http\Controllers;

use App\Actions\Trainer\LinkClient;
use App\Enums\BookingStatus;
use App\Http\Controllers\Concerns\BuildsTrainerArea;
use App\Models\Booking;
use App\Models\BookingSeries;
use App\Models\ClientPackage;
use App\Models\ClientPayment;
use App\Models\Message;
use App\Models\Service;
use App\Models\TrainerClient;
use App\Models\TrainerClientNote;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Support\ClientAbout;
use App\Support\ClientAttendance;
use App\Support\ClientProgress;
use App\Support\TrainerPastSessions;
use App\Support\TrainerSessions;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Clienti" of the trainer: everyone with at least one confirmed session, and
 * the people the trainer added by hand (TrainerClientRecordsController).
 * A client who booked several slots shows up once, with all of them, and
 * with the package still in progress. Requests still waiting for an answer
 * are in "Richieste", not here.
 */
class TrainerClientsController extends Controller
{
    use BuildsTrainerArea;

    /** "Svolte" of the card: the last sessions over. */
    public const PAST_SESSIONS = 10;

    /** @var list<int> the clients with a request waiting for the trainer */
    private array $requesting = [];

    public function __invoke(Request $request): Response
    {
        /** @var User $trainer */
        $trainer = $request->user();
        $profile = $trainer->trainerProfile;
        // "Invita i tuoi clienti" (and the personal links): only once the profile can be booked.
        $invite = $profile !== null && TrainerProfile::query()->published()->whereKey($profile->id)->exists()
            ? self::invite($profile)
            : null;
        $clients = $profile === null ? [] : $this->clients($profile, $invite);
        // "?cliente=37" (the account, from Home and Calendario) or "?con=12" (the row of the list).
        $record = $profile === null ? null : $this->selectedRecord($profile, $request);
        // "?chat=1": the conversation of that client open, instead of the card.
        $chat = $request->boolean('chat') && $record?->user_id !== null;
        $query = trim($request->string('q')->toString());

        return Inertia::render('trainer/clients', [
            'trainerArea' => $this->trainerArea(),
            // No profile yet (registration not sent): nobody could book.
            'clients' => $clients,
            'selectedId' => $record->user_id ?? ($request->integer('cliente') ?: null),
            'selectedRecordId' => $record?->id,
            'chat' => $chat,
            // The open conversation: marked as read when it is sent.
            'thread' => fn () => $chat ? app(MessagesController::class)->thread($record, $trainer) : null,
            // The last message and the unread dot of each client with an account, by row; polled.
            'chats' => fn () => $profile === null ? (object) [] : $this->chats($profile, $trainer),
            // "Cerca cliente o messaggio": the rows whose messages have the words.
            'query' => $query,
            'messageMatches' => $profile === null || mb_strlen($query) < 2 ? [] : $this->messageMatches($profile, $query),
            'invite' => $invite,
            // "Prenota" of the card: the same "Aggiungi seduta" of Calendario.
            'sessionOptions' => $profile === null ? null : app(TrainerCalendarController::class)->sessionOptions($profile),
            // The sessions the trainer can repeat every week ("Rendi fissa").
            'seriesServices' => $profile === null ? [] : $profile->services()
                ->where('is_active', true)->where('kind', 'session')->where('fixed_duration', false)
                ->orderBy('sort')->get()
                ->map(fn (Service $service) => [
                    'id' => $service->id,
                    'name' => $service->displayName(),
                    'minutes' => $service->minutes,
                    'priceCents' => $service->price_cents,
                ])->all(),
        ]);
    }

    /** The row of `?con=` (the list) or of `?cliente=` (the account), of this trainer. */
    private function selectedRecord(TrainerProfile $profile, Request $request): ?TrainerClient
    {
        if ($request->integer('con') > 0) {
            return $profile->clientRecords()->whereKey($request->integer('con'))->first();
        }

        return $request->integer('cliente') > 0
            ? $profile->clientRecords()->where('user_id', $request->integer('cliente'))->first()
            : null;
    }

    /**
     * The conversation of each client with an account, by row of the list:
     * the last message and whether there are new ones.
     *
     * @return array<int, array<string, mixed>>|object
     */
    private function chats(TrainerProfile $profile, User $trainer): array|object
    {
        $messages = app(MessagesController::class);
        $chats = $profile->clientRecords()
            ->whereNotNull('user_id')
            ->with(['user', 'trainerProfile.user', 'conversation.latestMessage'])
            ->get()
            ->mapWithKeys(fn (TrainerClient $record) => [$record->id => $messages->summary($record, $trainer)])
            ->all();

        // None yet goes as {} (an object), not as [].
        return $chats === [] ? (object) [] : $chats;
    }

    /**
     * The rows whose conversation has a message with these words.
     *
     * @return list<int>
     */
    private function messageMatches(TrainerProfile $profile, string $query): array
    {
        return array_values(Message::query()
            // % and _ would be wildcards: they are not searched.
            ->whereLike('messages.body', '%'.str_replace(['%', '_'], '', $query).'%')
            ->whereHas('conversation.trainerClient', fn ($record) => $record->where('trainer_profile_id', $profile->id))
            ->join('conversations', 'conversations.id', '=', 'messages.conversation_id')
            ->distinct()
            ->pluck('conversations.trainer_client_id')
            ->map(fn ($id) => (int) $id)
            ->all());
    }

    /**
     * The link for the trainer's own clients: the profile with "Marco ti ha
     * invitato", and the sign-ups it brought (users.acquisition, Stats).
     *
     * @return array{link: string, signups: int}
     */
    public static function invite(TrainerProfile $profile): array
    {
        return [
            'link' => route('trainers.show', [
                'slug' => $profile->slug,
                'invito' => 1,
                'utm_source' => 'trainer',
                'utm_medium' => 'invito',
                'utm_campaign' => $profile->slug,
            ]),
            'signups' => User::query()
                ->where('acquisition->source', 'trainer')
                ->where('acquisition->campaign', $profile->slug)
                ->count(),
        ];
    }

    /**
     * The clients with the closest session first, then the others from the
     * most recent session, and the ones with no session yet at the end.
     *
     * @param  array{link: string, signups: int}|null  $invite  null: the profile is not public, no personal links
     * @return array<int, array<string, mixed>>
     */
    private function clients(TrainerProfile $profile, ?array $invite): array
    {
        $now = CarbonImmutable::now();
        app(LinkClient::class)->backfill($profile);

        $records = $profile->clientRecords()->with(['user.clientPreference', 'payments', 'clientNotes'])->get();
        $bookings = $profile->bookings()
            ->where('status', BookingStatus::Confirmed)
            // Deleted accounts: the past sessions stay, but there is nobody to show.
            // "Aggiungi seduta" with someone without an account: by their row of the list.
            ->where(fn ($query) => $query->whereNotNull('client_id')->orWhereNotNull('trainer_client_id'))
            ->with(TrainerSessions::WITH)
            ->orderBy('starts_at')
            ->get()
            ->groupBy(fn (Booking $booking) => $booking->client_id ?? 'record-'.$booking->trainer_client_id);
        $attendance = ClientAttendance::forClients($records->pluck('user_id'), $profile);
        $this->requesting = array_values($profile->bookings()->awaitingAnswer()->fromClient()
            ->whereNotNull('client_id')->distinct()->pluck('client_id')->map(fn ($id) => (int) $id)->all());
        $packages = $this->packages($profile);
        // "Sedute fisse" still going, with how many sessions are in the calendar.
        $series = BookingSeries::query()->active()
            ->where('trainer_profile_id', $profile->id)
            ->withCount(['bookings as upcoming_count' => fn ($query) => $query
                ->where('status', BookingStatus::Confirmed)
                ->where('starts_at', '>', $now)])
            ->orderBy('weekday')->orderBy('start_time')
            ->get()
            ->groupBy('client_id');

        return $records
            ->map(fn (TrainerClient $record) => $this->client(
                $record,
                $bookings->get($record->user_id ?? 'record-'.$record->id, new Collection),
                $now,
                $record->user_id === null ? null : $attendance[$record->user_id],
                $record->user_id === null ? null : $packages->get($record->user_id),
                $invite,
                $profile,
                $series->get($record->user_id, new Collection),
            ))
            ->sort(function (array $a, array $b) {
                if ($a['nextSession'] !== null || $b['nextSession'] !== null) {
                    // Who has a next session comes first, the closest one on top.
                    return [$a['nextSession'] === null, $a['nextSession']] <=> [$b['nextSession'] === null, $b['nextSession']];
                }

                return [$a['lastSession'] === null, $b['lastSession']] <=> [$b['lastSession'] === null, $a['lastSession']]
                    ?: strcasecmp($a['name'], $b['name']);
            })
            ->values()
            ->all();
    }

    /**
     * The package of each client not all done yet: the most recent one.
     *
     * @return Collection<int, ClientPackage> by client id
     */
    private function packages(TrainerProfile $profile): Collection
    {
        return $profile->clientPackages()
            ->bought()
            ->whereNotNull('client_id')
            ->withSessionCounts()
            ->oldest('bought_at')
            ->get()
            ->filter(fn (ClientPackage $package) => ($package->done_count ?? 0) < $package->sessions_total)
            // The last one of each client wins.
            ->keyBy('client_id');
    }

    /**
     * @param  Collection<int, Booking>  $bookings  of one client, in order; none for who was just added
     * @param  array<string, mixed>|null  $attendance  from ClientAttendance
     * @param  array{link: string, signups: int}|null  $invite
     * @param  Collection<int, BookingSeries>  $series  the client's "sedute fisse" going on
     * @return array<string, mixed>
     */
    private function client(TrainerClient $record, Collection $bookings, CarbonImmutable $now, ?array $attendance, ?ClientPackage $package, ?array $invite, TrainerProfile $profile, Collection $series): array
    {
        $user = $record->user;
        $first = $bookings->first();
        $past = $bookings->filter(fn (Booking $booking) => $booking->ends_at <= $now);
        $last = $bookings->filter(fn (Booking $booking) => $booking->starts_at <= $now)->last();
        $upcoming = $bookings->filter(fn (Booking $booking) => $booking->starts_at > $now)->values();
        $next = $upcoming->first();

        return [
            // The account: what the links of Panoramica and Calendario use. Null while there is none.
            'id' => $record->user_id,
            // The row of the trainer's list: what the page selects and edits.
            'recordId' => $record->id,
            'registered' => $record->isRegistered(),
            'name' => $user->name ?? $record->name,
            'sessions' => $bookings->count(),
            'firstSession' => $first === null ? null : $this->iso($first->starts_at),
            'lastSession' => $last === null ? null : $this->iso($last->starts_at),
            'nextSession' => $next === null ? null : $this->iso($next->starts_at),
            // Under the name: what they book, from the most recent session.
            'lastService' => ($last ?? $first)->service_name ?? '',
            'upcomingCount' => $upcoming->count(),
            'done' => $past->whereNull('no_show_at')->count(),
            'missed' => $past->whereNotNull('no_show_at')->count(),
            'package' => $package === null ? null : [
                'name' => $package->name,
                'done' => $package->done_count ?? 0,
                'total' => $package->sessions_total,
            ],
            'attendance' => $attendance,
            // "Sul cliente": what the client wrote in "Su di te".
            'about' => ClientAbout::from($user),
            // With an account: the account's contacts. Otherwise the ones the trainer wrote.
            'contacts' => [
                'email' => $user->email ?? $record->email ?? '',
                'phone' => $user->phone ?? $record->phone,
            ],
            // "Progressi": only while the client shares them with this trainer.
            'progress' => $user !== null && $record->sharesProgress() ? [
                ...ClientProgress::for($user)->summary($profile->id),
                'weights' => ClientProgress::weights($user, 12),
            ] : null,
            // "Nota per il cliente": the client reads it in "Panoramica".
            'sharedNote' => $record->shared_note,
            'sharedNoteAt' => $record->shared_note_at === null ? null : $this->iso($record->shared_note_at),
            // The trainer's own: never shown to the client.
            'goal' => $record->goal,
            // The old single note: shown as the first, undated, while it has text.
            'notes' => $record->private_notes,
            // "Note": the dated ones, the most recent first.
            'datedNotes' => $record->clientNotes->map(fn (TrainerClientNote $note) => [
                'id' => $note->id,
                'body' => $note->body,
                'createdAt' => $this->iso($note->created_at ?? $now),
                'edited' => $note->updated_at !== null && $note->created_at !== null && $note->updated_at->gt($note->created_at),
            ])->all(),
            'payments' => $record->payments->map(fn (ClientPayment $payment) => [
                'id' => $payment->id,
                'amountCents' => $payment->amount_cents,
                'paidOn' => $payment->paid_on->toDateString(),
                'note' => $payment->note,
            ])->all(),
            'paidCents' => $record->payments->sum('amount_cents'),
            // The personal link, until the person signs up with it.
            'inviteLink' => $invite === null || $record->isRegistered() ? null : $record->inviteLink($profile),
            // "Sedute fisse" going on, and the open package they could use up.
            'series' => $series->map(fn (BookingSeries $item) => [
                'id' => $item->id,
                'label' => $item->label(),
                'name' => $item->service_name,
                'minutes' => $item->minutes,
                'endsOn' => $item->ends_on?->toDateString(),
                'upcomingCount' => (int) ($item->upcoming_count ?? 0),
                'usesPackage' => $item->client_package_id !== null,
            ])->values()->all(),
            'seriesPackage' => $package === null || $package->remaining() < 1 ? null : [
                'id' => $package->id,
                'name' => $package->name,
                'remaining' => $package->remaining(),
            ],
            // Every session still to come.
            'upcoming' => $upcoming->map(TrainerSessions::row(...))->all(),
            // "Svolte": the last ones over, the most recent first.
            'past' => $past->reverse()->take(self::PAST_SESSIONS)->map(TrainerPastSessions::row(...))->values()->all(),
            // Taken out of "Ancora da contattare" with the X.
            'contactHidden' => $record->contact_hidden_at !== null,
            // A request of this client waiting for the trainer: the filter "Richieste".
            'hasRequest' => $record->user_id !== null && in_array($record->user_id, $this->requesting, true),
        ];
    }
}
