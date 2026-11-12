<?php

namespace App\Http\Controllers;

use App\Actions\Bookings\CreateBookingSeries;
use App\Enums\BookingActor;
use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\BookingSeries;
use App\Models\TrainerClient;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Notifications\BookingSeriesNotice;
use App\Support\TrainerSlots;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

/**
 * "Sedute fisse" in the card of a client: "ogni martedì alle 18", for a
 * client with an account. The sessions are real confirmed bookings made some
 * weeks ahead (GenerateSeries) and topped up every day (bookings:extend-series).
 * A client can also ask for them when booking ("Ripeti ogni settimana").
 */
class TrainerSeriesController extends Controller
{
    /** A rule can't run for more than this: it is set again after a year. */
    private const MAX_DAYS = 366;

    public function store(Request $request, TrainerClient $client, CreateBookingSeries $create): RedirectResponse
    {
        $profile = $this->profile($request);
        abort_unless($client->trainer_profile_id === $profile->id, 404);

        if ($client->user_id === null) {
            throw ValidationException::withMessages(['series' => 'Il cliente deve prima iscriversi: manda il suo link personale.']);
        }

        $today = CarbonImmutable::now(TrainerSlots::TIMEZONE)->toDateString();
        $data = $request->validate([
            'service_id' => ['nullable', 'integer', 'required_without:client_package_id', 'prohibits:client_package_id'],
            'client_package_id' => ['nullable', 'integer'],
            'weekday' => ['required', 'integer', 'between:1,7'],
            'start_time' => ['required', 'regex:/^([01]\d|2[0-3]):[0-5]\d$/'],
            'starts_on' => ['required', 'date_format:Y-m-d', 'after_or_equal:'.$today],
            'ends_on' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:starts_on', 'before_or_equal:'.CarbonImmutable::parse($today)->addDays(self::MAX_DAYS)->toDateString()],
        ], [
            'service_id.required_without' => 'Scegli che tipo di seduta.',
            'service_id.prohibits' => 'Scegli il tipo di seduta oppure il pacchetto, non tutti e due.',
            'weekday.*' => 'Scegli il giorno della settimana.',
            'start_time.*' => 'Scegli l’orario.',
            'starts_on.*' => 'Scegli da quando parte (da oggi in poi).',
            'ends_on.after_or_equal' => 'La fine non può venire prima dell’inizio.',
            'ends_on.before_or_equal' => 'Le sedute fisse durano al massimo un anno: potrai rinnovarle.',
        ]);

        /** @var User $clientUser */
        $clientUser = $client->user;
        $result = $create->handle($profile, $clientUser, $data);

        Inertia::flash('toast', ['type' => 'success', 'message' => self::createdMessage($result['created'], $result['skipped'])]);

        return back();
    }

    /**
     * "4 sedute fissate. Saltate perché occupate o chiuse: 3 nov."
     *
     * @param  list<string>  $skipped  Y-m-d
     */
    public static function createdMessage(int $created, array $skipped): string
    {
        $message = $created === 1 ? '1 seduta fissata.' : "{$created} sedute fissate.";

        if ($skipped === []) {
            return $message;
        }

        return $message.' Saltate perché occupate o chiuse: '.collect($skipped)
            ->map(fn (string $date) => CarbonImmutable::parse($date)->settings(['locale' => 'it'])->isoFormat('D MMM'))
            ->implode(', ').'.';
    }

    /**
     * "Termina": no more sessions are made. With `cancel_future` the sessions
     * still to come are called off too (the client is told once).
     */
    public function end(Request $request, BookingSeries $series): RedirectResponse
    {
        /** @var User $trainer */
        $trainer = $request->user();
        $profile = $this->profile($request);
        abort_unless($series->trainer_profile_id === $profile->id, 404);

        $data = $request->validate(['cancel_future' => ['required', 'boolean']]);
        $cancelled = 0;

        DB::transaction(function () use ($series, $data, $trainer, &$cancelled) {
            $series->forceFill(['status' => BookingSeries::ENDED, 'ended_at' => now()])->save();

            if ($data['cancel_future']) {
                $series->bookings()
                    ->where('status', BookingStatus::Confirmed)
                    ->where('starts_at', '>', now())
                    ->get()
                    ->each(function (Booking $booking) use ($trainer, &$cancelled) {
                        $booking->cancel(BookingActor::Trainer, $trainer);
                        $cancelled++;
                    });
            }
        });

        if ($cancelled > 0) {
            TrainerSlots::refresh($profile);
        }

        $series->setRelation('trainerProfile', $profile)->client->notify(new BookingSeriesNotice($series, BookingSeriesNotice::ENDED, $cancelled));

        Inertia::flash('toast', ['type' => 'success', 'message' => $cancelled > 0
            ? 'Sedute fisse terminate: le sedute in programma sono annullate e il cliente è stato avvisato.'
            : 'Sedute fisse terminate: quelle già in calendario restano.']);

        return back();
    }

    private function profile(Request $request): TrainerProfile
    {
        /** @var User $user */
        $user = $request->user();

        return $user->trainerProfile ?? abort(404);
    }
}
