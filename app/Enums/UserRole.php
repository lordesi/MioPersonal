<?php

namespace App\Enums;

/** What a user can do on MioPersonal. Saved as text in `users.role`. */
enum UserRole: string
{
    case Client = 'client';
    case Trainer = 'trainer';
    case Admin = 'admin';

    /** Name of the route where each role starts: after login and when a page is not for them. */
    public function homeRoute(): string
    {
        return match ($this) {
            self::Client => 'client.bookings',
            self::Trainer => 'trainer.today',
            self::Admin => 'admin.overview',
        };
    }
}
