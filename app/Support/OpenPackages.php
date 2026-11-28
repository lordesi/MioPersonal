<?php

namespace App\Support;

use App\Models\ClientPackage;
use App\Models\TrainerProfile;
use Illuminate\Support\Collection;

/**
 * The packages of a trainer still going (bought, not all done), each with
 * the row of the trainer's list ("Clienti") it belongs to. The ones added
 * by the trainer ("Aggiungi pacchetto") carry the row; the ones bought on
 * the site are found from the account (null if it is not in the list yet).
 * Packages of a deleted account, without a row, are left out.
 */
final class OpenPackages
{
    /**
     * Oldest first.
     *
     * @param  array<array-key, string|\Closure>  $with  relations to load, as `with()`
     * @return Collection<int, array{package: ClientPackage, recordId: int|null}>
     */
    public static function of(TrainerProfile $profile, array $with = []): Collection
    {
        /** @var Collection<int, int> $records the row of each account in the list */
        $records = $profile->clientRecords()->whereNotNull('user_id')->pluck('id', 'user_id');

        return $profile->clientPackages()
            ->bought()
            ->where(fn ($query) => $query->whereNotNull('client_id')->orWhereNotNull('trainer_client_id'))
            ->withSessionCounts()
            ->with($with)
            ->oldest('bought_at')
            ->oldest('id')
            ->get()
            ->filter(fn (ClientPackage $package) => ($package->done_count ?? 0) < $package->sessions_total)
            ->map(fn (ClientPackage $package) => [
                'package' => $package,
                'recordId' => $package->trainer_client_id ?? ($package->client_id === null ? null : $records->get($package->client_id)),
            ])
            ->values();
    }
}
