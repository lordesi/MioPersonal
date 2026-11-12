<?php

namespace App\Actions\Trainer;

use App\Models\Booking;
use App\Models\BookingSeries;
use App\Models\ClientPackage;
use App\Models\Service;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Once, after SaveTrainerServices stopped replacing the services: the
 * bookings, "sedute fisse" and clients' packages that lost their service
 * (service_id null) get it back when exactly one service of the same
 * trainer has the same name and duration. The others stay as they are.
 *
 * `services:relink` runs it (a dry run unless --force).
 */
class RelinkServices
{
    /**
     * @return array{relinked: int, ambiguous: int, missing: int}
     */
    public function handle(bool $write): array
    {
        $counts = ['relinked' => 0, 'ambiguous' => 0, 'missing' => 0];
        /** @var array<int, Collection<int, Service>> $services trainer profile id => its services */
        $services = [];
        $servicesOf = function (int $profileId) use (&$services): Collection {
            return $services[$profileId] ??= Service::query()->where('trainer_profile_id', $profileId)->get();
        };

        $relink = function (Model $row, int $profileId, string $name, int $minutes) use ($servicesOf, $write, &$counts): void {
            $matches = $servicesOf($profileId)->filter(
                fn (Service $service) => $service->displayName() === $name && $service->minutes === $minutes,
            );

            if ($matches->count() !== 1) {
                $counts[$matches->isEmpty() ? 'missing' : 'ambiguous']++;

                return;
            }

            $counts['relinked']++;

            if ($write) {
                $row->forceFill(['service_id' => $matches->firstOrFail()->id])->save();
            }
        };

        Booking::query()->whereNull('service_id')->each(function (Booking $booking) use ($relink) {
            $relink($booking, $booking->trainer_profile_id, $booking->service_name, (int) $booking->starts_at->diffInMinutes($booking->ends_at));
        });

        BookingSeries::query()->whereNull('service_id')->each(function (BookingSeries $series) use ($relink) {
            $relink($series, $series->trainer_profile_id, $series->service_name, $series->minutes);
        });

        ClientPackage::query()->whereNull('service_id')->each(function (ClientPackage $package) use ($relink) {
            $relink($package, $package->trainer_profile_id, $package->name, $package->minutes);
        });

        return $counts;
    }
}
