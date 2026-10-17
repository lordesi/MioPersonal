<?php

namespace App\Jobs;

use App\Models\TrainerPlace;
use App\Support\Geocoder;
use Illuminate\Foundation\Bus\Dispatchable;

/**
 * Finds where a studio is from its address, for the "Zona" map. Started with
 * dispatchAfterResponse(): it runs after the page is sent to the trainer, so
 * saving stays fast and no queue worker is needed.
 */
class GeocodeTrainerPlace
{
    use Dispatchable;

    public function __construct(public int $placeId) {}

    public function handle(): void
    {
        // Saved again in the meantime: the old row is gone, nothing to do.
        $place = TrainerPlace::with('city')->find($this->placeId);

        if ($place === null || $place->address === null || $place->city === null) {
            return;
        }

        $coordinates = Geocoder::find($place->address, $place->city);

        if ($coordinates !== null) {
            $place->update($coordinates);
        }
    }
}
