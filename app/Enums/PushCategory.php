<?php

namespace App\Enums;

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
    case Notes = 'notes';
    case Events = 'events';
    case Waitlist = 'waitlist';
    case GymLinks = 'gym_links';

    /**
     * The switches each role sees, in this order.
     *
     * @return list<self>
     */
    public static function forRole(UserRole $role): array
    {
        return match ($role) {
            UserRole::Client => [self::Bookings, self::Notes, self::Events, self::Waitlist],
            UserRole::Trainer => [self::Requests, self::Bookings, self::Events, self::GymLinks],
            UserRole::Gym => [self::GymLinks, self::Events],
            UserRole::Admin => [],
        };
    }

    public function label(): string
    {
        return match ($this) {
            self::Requests => 'Nuove richieste',
            self::Bookings => 'Prenotazioni',
            self::Notes => 'Note del trainer',
            self::Events => 'Eventi',
            self::Waitlist => 'Posti liberati',
            self::GymLinks => 'Collaborazioni',
        };
    }

    public function description(UserRole $role): string
    {
        return match ($this) {
            self::Requests => 'Quando un cliente prenota una seduta.',
            self::Bookings => $role === UserRole::Trainer
                ? 'Disdette e risposte dei clienti ai cambi di orario.'
                : 'Conferme, cambi di orario, sedute fisse e amici che si uniscono.',
            self::Notes => 'Quando il trainer scrive o cambia una nota per te.',
            self::Events => match ($role) {
                UserRole::Client => 'Posto confermato, eventi spostati o annullati.',
                default => 'Inviti a organizzare un evento insieme.',
            },
            self::Waitlist => 'Quando si libera un posto per cui hai chiesto “Avvisami”.',
            self::GymLinks => $role === UserRole::Gym
                ? 'Trainer che chiedono di unirsi alla palestra e inviti accettati.'
                : 'Inviti delle palestre e richieste accettate.',
        };
    }
}
