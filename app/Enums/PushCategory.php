<?php

namespace App\Enums;

use App\Support\Features;

/**
 * "Cosa ricevere sul dispositivo" in the settings: the kinds of push
 * notifications a user can turn off. Off stops only the push: the bell inside
 * the site and the emails stay (SendsPush::withPush()). Saved in
 * `users.notification_settings.push`, on until turned off.
 */
enum PushCategory: string
{
    case Requests = 'requests';
    case Bookings = 'bookings';
    case Cancellations = 'cancellations';
    case Notes = 'notes';
    case Events = 'events';
    case Waitlist = 'waitlist';
    case GymLinks = 'gym_links';
    case Messages = 'messages';

    /**
     * The switches each role sees, in this order; not the ones of the parts
     * of the site switched off (config/features.php).
     *
     * @return list<self>
     */
    public static function forRole(UserRole $role): array
    {
        $categories = match ($role) {
            UserRole::Client => [self::Bookings, self::Cancellations, self::Messages, self::Notes, self::Events, self::Waitlist],
            UserRole::Trainer => [self::Requests, self::Cancellations, self::Bookings, self::Messages, self::Events, self::GymLinks],
            UserRole::Gym => [self::GymLinks, self::Events],
            UserRole::Admin => [],
        };

        return array_values(array_filter($categories, fn (self $category) => match ($category) {
            self::Events => Features::events(),
            self::GymLinks => Features::gyms(),
            default => true,
        }));
    }

    public function label(): string
    {
        return match ($this) {
            self::Requests => 'Nuove richieste',
            self::Bookings => 'Prenotazioni',
            self::Cancellations => 'Cancellazioni',
            self::Notes => 'Note del trainer',
            self::Events => 'Eventi',
            self::Waitlist => 'Posti liberati',
            self::GymLinks => 'Collaborazioni',
            self::Messages => 'Messaggi',
        };
    }

    public function description(UserRole $role): string
    {
        return match ($this) {
            self::Requests => 'Quando un cliente prenota una seduta.',
            self::Bookings => $role === UserRole::Trainer
                ? 'Risposte dei clienti ai cambi di orario e alle sedute proposte.'
                : 'Conferme, cambi di orario, sedute fisse e amici che si uniscono.',
            self::Cancellations => $role === UserRole::Trainer
                ? 'Quando un cliente annulla una seduta confermata.'
                : 'Quando una seduta a cui partecipi viene annullata.',
            self::Notes => 'Quando il trainer scrive o cambia una nota per te.',
            self::Events => match ($role) {
                UserRole::Client => 'Posto confermato, eventi spostati o annullati.',
                default => 'Inviti a organizzare un evento insieme.',
            },
            self::Messages => $role === UserRole::Trainer
                ? 'Quando un cliente ti scrive.'
                : 'Quando il tuo trainer ti scrive.',
            self::Waitlist => 'Quando si libera un posto per cui hai chiesto “Avvisami”.',
            self::GymLinks => $role === UserRole::Gym
                ? 'Trainer che chiedono di unirsi alla palestra e inviti accettati.'
                : 'Inviti delle palestre e richieste accettate.',
        };
    }
}
