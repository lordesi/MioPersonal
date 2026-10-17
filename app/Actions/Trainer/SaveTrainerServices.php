<?php

namespace App\Actions\Trainer;

use App\Models\Service;
use App\Models\TrainerProfile;
use App\Support\TrainerSlots;
use Illuminate\Support\Facades\DB;

/**
 * Saves "Servizi e prezzi": from the "Servizi" page of the trainer area
 * (handle) and from step 4 of "Diventa trainer" (save, inside the
 * transaction of SaveTrainerProfile). The services are replaced, then the
 * computed fields of the search are updated.
 */
class SaveTrainerServices
{
    /**
     * "Servizi": public right away, without a new review.
     *
     * @param  array<string, mixed>  $data  validated by TrainerServicesRequest
     */
    public function handle(TrainerProfile $profile, array $data): void
    {
        DB::transaction(fn () => $this->save($profile, $data));

        // The durations may have changed: the free slots of the search too.
        TrainerSlots::refresh($profile->load('workingHours'));
    }

    /**
     * Separate online prices only for who trains both online and in person:
     * trains_online and trains_in_person must already be saved.
     *
     * @param  array<string, mixed>  $data  validated by servicesRules() of TrainerProfileRequest
     */
    public function save(TrainerProfile $profile, array $data): void
    {
        $sessions = self::sessionTypes($data['sessions'], self::hasOwnOnlinePrices($profile));

        $this->saveRows($profile, $data, $sessions);
        self::refreshComputedFields($profile);
    }

    /**
     * "Modifica profilo" may take away online or the places in person: then
     * the separate online prices go, the same prices cover online.
     */
    public function dropOnlinePricesIfUnused(TrainerProfile $profile): void
    {
        if (self::hasOwnOnlinePrices($profile)) {
            return;
        }

        if ($profile->services()->where('online_only', true)->delete() > 0) {
            self::refreshComputedFields($profile);
        }
    }

    private static function hasOwnOnlinePrices(TrainerProfile $profile): bool
    {
        return $profile->trains_online && $profile->trains_in_person;
    }

    /**
     * From the saved rows: "da 25 €" in the search (the lowest price of a
     * kind of session, online too) and the bookable durations
     * (session_minutes, used for the free slots), shortest first.
     */
    private static function refreshComputedFields(TrainerProfile $profile): void
    {
        $services = $profile->services()->get();
        $kinds = $services->filter(fn (Service $service) => $service->kind === 'session' && ! $service->fixed_duration);
        $minutes = $services->pluck('minutes')->unique()->sort()->values()->all();

        $profile->forceFill([
            'price_from_cents' => $kinds->min('price_cents'),
            'session_minutes' => $minutes,
        ])->save();
    }

    /**
     * A list of prices from the form, by duration, shortest first:
     * [{minutes: '90', price_cents: '6000'}, {minutes: '60', price_cents: '4500'}] → [60 => 4500, 90 => 6000].
     * Forms with files send the numbers as text.
     *
     * @param  list<array{minutes: int|string, price_cents: int|string}>  $prices
     * @return array<int, int>
     */
    private static function pricesByMinutes(array $prices): array
    {
        $byMinutes = [];

        foreach ($prices as $price) {
            $byMinutes[(int) $price['minutes']] = (int) $price['price_cents'];
        }

        ksort($byMinutes);

        return $byMinutes;
    }

    /**
     * The kinds of session of the form, with their prices by duration.
     * Without separate online prices, `online` is empty.
     *
     * @param  list<array{name: string, note?: string|null, prices: list<array{minutes: int|string, price_cents: int|string}>, online_prices?: list<array{minutes: int|string, price_cents: int|string}>|null, online_note?: string|null}>  $sessions
     * @return list<array{name: string, note: string|null, prices: array<int, int>, online: array<int, int>, online_note: string|null}>
     */
    private static function sessionTypes(array $sessions, bool $ownOnlinePrices): array
    {
        $note = fn (mixed $text) => filled($text) ? trim((string) $text) : null;

        return array_map(fn (array $session) => [
            'name' => trim($session['name']),
            'note' => $note($session['note'] ?? null),
            'prices' => self::pricesByMinutes($session['prices']),
            'online' => $ownOnlinePrices && filled($session['online_prices'] ?? null)
                ? self::pricesByMinutes($session['online_prices'])
                : [],
            'online_note' => $note($session['online_note'] ?? null),
        ], $sessions);
    }

    /**
     * "Servizi e prezzi" becomes rows of `services`, in this order:
     * - the first session (optional): "Prima seduta", fixed duration, can be free (0);
     * - each kind of session ("Seduta singola", "Calisthenics"…): one row for
     *   each duration, with its own price and the name of the kind; then its
     *   online rows (online_only, same name), when online has its own prices;
     * - the packages (at most 3): sessions × duration, total price.
     *
     * The rows of a kind of session have fixed_duration = false: on the
     * profile the rows with the same name are one service and the client
     * chooses the duration (see TrainerProfileController::services()). Every
     * row is booked for its own minutes and at its own price.
     *
     * @param  array<string, mixed>  $data
     * @param  list<array{name: string, note: string|null, prices: array<int, int>, online: array<int, int>, online_note: string|null}>  $sessions
     */
    private function saveRows(TrainerProfile $profile, array $data, array $sessions): void
    {
        // TODO (step 5): bookings will point to services; then hide the old ones instead of deleting them.
        $profile->services()->delete();

        /** @var array{minutes: int|string, price_cents: int|string, note?: string|null}|null $first */
        $first = $data['first_session'] ?? null;
        /** @var list<array{sessions: int|string, minutes: int|string, price_cents: int|string, note?: string|null}> $packages */
        $packages = $data['packages'] ?? [];
        $note = fn (mixed $text) => filled($text) ? trim((string) $text) : null;
        $rows = [];

        if ($first !== null) {
            $rows[] = [
                'kind' => 'session',
                'name' => Service::FIRST_SESSION_NAME,
                'minutes' => (int) $first['minutes'],
                'price_cents' => (int) $first['price_cents'],
                'note' => $note($first['note'] ?? null),
            ];
        }

        foreach ($sessions as $session) {
            foreach ($session['prices'] as $minutes => $cents) {
                $rows[] = ['kind' => 'session', 'name' => $session['name'], 'minutes' => $minutes, 'price_cents' => $cents, 'fixed_duration' => false, 'note' => $session['note']];
            }

            foreach ($session['online'] as $minutes => $cents) {
                $rows[] = ['kind' => 'session', 'name' => $session['name'], 'minutes' => $minutes, 'price_cents' => $cents, 'fixed_duration' => false, 'note' => $session['online_note'], 'online_only' => true];
            }
        }

        foreach ($packages as $package) {
            $rows[] = [
                'kind' => 'package',
                'name' => "Pacchetto {$package['sessions']} sedute",
                'minutes' => (int) $package['minutes'],
                'price_cents' => (int) $package['price_cents'],
                'package_sessions' => (int) $package['sessions'],
                'note' => $note($package['note'] ?? null),
            ];
        }

        foreach ($rows as $index => $row) {
            $profile->services()->create([...$row, 'sort' => $index]);
        }
    }
}
