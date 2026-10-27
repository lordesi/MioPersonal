<?php

namespace App\Actions\Trainer;

use App\Models\TrainerDocument;
use App\Models\TrainerPhoto;
use App\Models\TrainerProfile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Deletes a trainer profile with everything that belongs to it: services,
 * hours, bookings and reviews go with the database row (cascade), the photos
 * and the certificates are removed from the disk once the deletion is saved.
 *
 * Used by "Chiudi il profilo" (the account stays, as a client) and by
 * "Elimina account".
 */
class DeleteTrainerProfile
{
    public function handle(TrainerProfile $profile): void
    {
        DB::transaction(function () use ($profile) {
            $photos = $profile->photos()->pluck('path')->all();
            $documents = $profile->documents()->whereNotNull('path')->pluck('path')->all();

            $profile->delete();

            // Only if the transaction is saved: otherwise the files are still needed.
            DB::afterCommit(function () use ($photos, $documents) {
                Storage::disk(TrainerPhoto::DISK)->delete($photos);
                Storage::disk(TrainerDocument::DISK)->delete($documents);
            });
        });
    }
}
