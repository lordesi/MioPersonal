<?php

namespace App\Actions\Bookings;

use App\Models\Booking;
use App\Models\BookingSeries;
use App\Models\ClientPackage;
use App\Models\Service;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Notifications\BookingSeriesNotice;
use App\Support\TrainerSlots;
use Carbon\CarbonImmutable;
use Illuminate\Validation\ValidationException;

/**
 * "Sedute fisse": a rule "ogni martedì alle 18" for a client, and its first
 * sessions (GenerateSeries). Set by the trainer in the client's card, or
 * from a client's request "Ripeti ogni settimana" (fromRequest).
 */
class CreateBookingSeries
{
    public function __construct(private GenerateSeries $generate) {}

    /**
     * @param  array{service_id?: int|string|null, client_package_id?: int|string|null, weekday: int|string, start_time: string, starts_on: string, ends_on?: string|null}  $data
     * @param  Booking|null  $first  the session the client asked for: it opens the rule
     * @return array{series: BookingSeries, created: int, skipped: list<string>}
     */
    public function handle(TrainerProfile $profile, User $client, array $data, ?Booking $first = null): array
    {
        [$name, $price, $minutes, $serviceId, $packageId, $online] = $this->what($profile, $client, $data);

        $exists = BookingSeries::query()->active()
            ->where('trainer_profile_id', $profile->id)
            ->where('client_id', $client->id)
            ->where('weekday', (int) $data['weekday'])
            ->where('start_time', $data['start_time'])
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages(['series' => 'Questo cliente ha già una seduta fissa a quel giorno e a quell’ora.']);
        }

        $series = new BookingSeries([
            'client_id' => $client->id,
            'service_id' => $serviceId,
            'client_package_id' => $packageId,
            'service_name' => $name,
            'price_cents' => $price,
            'minutes' => $minutes,
            'place_label' => $first->place_label ?? app(CreateBooking::class)->placeLabel($profile, $online),
            'weekday' => (int) $data['weekday'],
            'start_time' => $data['start_time'],
            'starts_on' => $data['starts_on'],
            'ends_on' => $data['ends_on'] ?? null,
        ]);
        $series->trainer_profile_id = $profile->id;
        $series->save();
        $series->setRelation('trainerProfile', $profile)->setRelation('client', $client);

        // The session asked for is the first of the rule: GenerateSeries skips its date.
        $first?->forceFill(['booking_series_id' => $series->id])->save();

        $result = $this->generate->handle($series);
        $created = $result['created'] + ($first !== null ? 1 : 0);

        // Not a single date free: nothing worth keeping.
        if ($created === 0) {
            $series->delete();

            throw ValidationException::withMessages(['series' => 'Nessuna di queste date è libera: scegli un altro giorno o un altro orario.']);
        }

        $client->notify(new BookingSeriesNotice($series, BookingSeriesNotice::CREATED, $created));

        return ['series' => $series, 'created' => $created, 'skipped' => $result['skipped']];
    }

    /**
     * "Accetta ogni settimana": the rule of a confirmed request, same day,
     * time, session (or package) and place, from the week after.
     *
     * @return array{series: BookingSeries, created: int, skipped: list<string>}
     */
    public function fromRequest(Booking $booking): array
    {
        $start = $booking->starts_at->toImmutable()->setTimezone(TrainerSlots::TIMEZONE);
        /** @var User $client */
        $client = $booking->client;

        return $this->handle($booking->trainerProfile, $client, [
            'service_id' => $booking->client_package_id === null ? $booking->service_id : null,
            'client_package_id' => $booking->client_package_id,
            'weekday' => $start->dayOfWeekIso,
            'start_time' => $start->format('H:i'),
            'starts_on' => $start->toDateString(),
        ], $booking);
    }

    /**
     * Whether a client can ask "Ripeti ogni settimana" for this service: a
     * plain session (not the first one, not with friends) or a package.
     */
    public static function canRepeat(?Service $service, int $people = 1): bool
    {
        return $service !== null
            && $people === 1
            && ($service->kind === 'package' || ($service->kind === 'session' && ! $service->isFirstSession()));
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
                ->whereKey($data['client_package_id'])
                ->first();

            if ($package === null || $package->remaining() < 1) {
                throw ValidationException::withMessages(['client_package_id' => 'Questo pacchetto non ha più sedute da prenotare.']);
            }

            $online = $package->service_id !== null && Service::whereKey($package->service_id)->value('online_only');

            return [$package->name, 0, $package->minutes, $package->service_id, $package->id, (bool) $online];
        }

        $service = $profile->services()->where('is_active', true)->whereKey($data['service_id'] ?? null)->first();

        // The "Prima seduta" and the packages are not sessions to repeat every week.
        if ($service === null || $service->kind !== 'session' || $service->isFirstSession()) {
            throw ValidationException::withMessages(['service_id' => 'Scegli una delle tue sedute.']);
        }

        return [$service->displayName(), $service->price_cents, $service->minutes, $service->id, null, (bool) $service->online_only];
    }

    /** "Ogni martedì alle 18:00" for a start, before the rule exists. */
    public static function label(CarbonImmutable $start): string
    {
        $start = $start->setTimezone(TrainerSlots::TIMEZONE);

        return 'Ogni '.BookingSeries::WEEKDAYS[$start->dayOfWeekIso - 1].' alle '.$start->format('H:i');
    }
}
