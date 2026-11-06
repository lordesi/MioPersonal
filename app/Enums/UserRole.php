<?php

namespace App\Enums;

/** What a user can do on MioPersonal. Saved as text in `users.role`. */
enum UserRole: string
{
    case Client = 'client';
    case Trainer = 'trainer';
    case Admin = 'admin';
    /** The account of a gym: its profile, plans, promotions and trainers. */
    case Gym = 'gym';

    /** Name of the route where each role starts: after login and when a page is not for them. */
    public function homeRoute(): string
    {
        return match ($this) {
            self::Client => 'client.home',
            self::Trainer => 'trainer.today',
            self::Admin => 'admin.overview',
            self::Gym => 'gym.dashboard',
        };
    }

    /** Name of the route of "Impostazioni account"; admins have none. */
    public function settingsRoute(): string
    {
        return match ($this) {
            self::Client => 'account.settings',
            self::Trainer => 'trainer.settings',
            self::Admin => 'admin.overview',
            self::Gym => 'gym.settings',
        };
    }
}
