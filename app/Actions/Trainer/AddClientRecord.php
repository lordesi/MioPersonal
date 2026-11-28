<?php

namespace App\Actions\Trainer;

use App\Models\TrainerClient;
use App\Models\TrainerProfile;

/**
 * "Nuovo cliente" of "Aggiungi seduta", "Aggiungi pacchetto" and "Aggiungi
 * cliente": a person of the trainer's list, without an account yet. The
 * same email is the row already in the list.
 */
class AddClientRecord
{
    /**
     * @param  array{name: string, email?: string|null, phone?: string|null}  $data
     */
    public function handle(TrainerProfile $profile, array $data): TrainerClient
    {
        $email = self::clean($data['email'] ?? null);

        if ($email !== null) {
            $existing = $profile->clientRecords()->whereRaw('lower(email) = ?', [mb_strtolower($email)])->first();

            if ($existing !== null) {
                return $existing;
            }
        }

        return $profile->clientRecords()->create([
            'name' => trim($data['name']),
            'email' => $email,
            'phone' => self::clean($data['phone'] ?? null),
        ]);
    }

    private static function clean(?string $value): ?string
    {
        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }
}
