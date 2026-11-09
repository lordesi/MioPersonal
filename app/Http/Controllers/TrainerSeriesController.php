<?php

namespace App\Http\Controllers;

use App\Actions\Bookings\CreateBooking;
use App\Actions\Bookings\GenerateSeries;
use App\Enums\BookingActor;
use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\BookingSeries;
use App\Models\ClientPackage;
use App\Models\Service;
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
 */
class TrainerSeriesController extends Controller
{
    /** A rule can't run for more than this: it is set again after a year. */
    private const MAX_DAYS = 366;

    public function store(Request $request, TrainerClient $client, GenerateSeries $generate): RedirectResponse
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
        [$name, $price, $minutes, $serviceId, $packageId, $online] = $this->what($profile, $clientUser, $data);

        $exists = BookingSeries::query()->active()
            ->where('trainer_profile_id', $profile->id)
            ->where('client_id', $clientUser->id)
            ->where('weekday', $data['weekday'])
            ->where('start_time', $data['start_time'])
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages(['series' => 'Questo cliente ha già una seduta fissa a quel giorno e a quell’ora.']);
        }

        $series = new BookingSeries([
            'client_id' => $clientUser->id,
            'service_id' => $serviceId,
            'client_package_id' => $packageId,
            'service_name' => $name,
            'price_cents' => $price,
            'minutes' => $minutes,
            'place_label' => app(CreateBooking::class)->placeLabel($profile, $online),
            'weekday' => $data['weekday'],
            'start_time' => $data['start_time'],
            'starts_on' => $data['starts_on'],
            'ends_on' => $data['ends_on'] ?? null,
        ]);
        $series->trainer_profile_id = $profile->id;
        $series->save();
        $series->setRelation('trainerProfile', $profile)->setRelation('client', $clientUser);

        $result = $generate->handle($series);

        // Not a single date free: nothing worth keeping.
        if ($result['created'] === 0) {
            $series->delete();

            throw ValidationException::withMessages(['series' => 'Nessuna di queste date è libera: scegli un altro giorno o un altro orario.']);
        }

        $clientUser->notify(new BookingSeriesNotice($series, BookingSeriesNotice::CREATED, $result['created']));

        $skipped = $result['skipped'] === []
            ? ''
            : ' Saltate perché occupate o chiuse: '.collect($result['skipped'])->map(fn (string $date) => CarbonImmutable::parse($date)->locale('it')->isoFormat('D MMM'))->implode(', ').'.';

        Inertia::flash('toast', ['type' => 'success', 'message' => ($result['created'] === 1 ? '1 seduta fissata.' : "{$result['created']} sedute fissate.").$skipped]);

        return back();
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

    /**
     * What is booked: a session of the trainer, or one of the client's package.
     *
     * @param  array<string, mixed>  $data
     * @return array{string, int, int, int|null, int|null, bool} name, price, minutes, service id, package id, online
     */
    private function what(TrainerProfile $profile, User $client, array $data): array
    {
        if (filled($data['client_package_id'] ?? null)) {
            $package = ClientPackage::query()->bought()
                ->withSessionCounts()
                ->where('trainer_profile_id', $profile->id)
                ->where('client_id', $client->id)
                ->find($data['client_package_id']);

            if ($package === null || $package->remaining() < 1) {
                throw ValidationException::withMessages(['client_package_id' => 'Questo pacchetto non ha più sedute da prenotare.']);
            }

            $online = $package->service_id !== null && Service::whereKey($package->service_id)->value('online_only');

            return [$package->name, 0, $package->minutes, $package->service_id, $package->id, (bool) $online];
        }

        $service = $profile->services()->where('is_active', true)->find($data['service_id']);

        // The "Prima seduta" and the packages are not sessions to repeat every week.
        if ($service === null || $service->kind !== 'session' || $service->isFirstSession()) {
            throw ValidationException::withMessages(['service_id' => 'Scegli una delle tue sedute.']);
        }

        return [$service->displayName(), $service->price_cents, $service->minutes, $service->id, null, (bool) $service->online_only];
    }

    private function profile(Request $request): TrainerProfile
    {
        /** @var User $user */
        $user = $request->user();

        return $user->trainerProfile ?? abort(404);
    }
}
