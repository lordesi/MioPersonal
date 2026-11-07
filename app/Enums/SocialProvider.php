<?php

namespace App\Enums;

/**
 * The socials a trainer can link with OAuth (App\Http\Controllers\TrainerSocialController).
 * The value is also the Socialite driver and the key in config/services.php.
 * The cases are in the order of the icons on the public profile.
 */
enum SocialProvider: string
{
    case Instagram = 'instagram';
    case TikTok = 'tiktok';
    case Facebook = 'facebook';
    case YouTube = 'youtube';

    public function label(): string
    {
        return match ($this) {
            self::Instagram => 'Instagram',
            self::TikTok => 'TikTok',
            self::Facebook => 'Facebook',
            self::YouTube => 'YouTube',
        };
    }

    /** Off until its app credentials are in the .env: no "Collega" button. */
    public function enabled(): bool
    {
        return filled(config("services.{$this->value}.client_id"));
    }

    /** The public page of a username ("giulia.fit"); Facebook gives its own link. */
    public function profileUrl(string $handle): string
    {
        return match ($this) {
            self::Instagram => "https://www.instagram.com/{$handle}/",
            self::TikTok => "https://www.tiktok.com/@{$handle}",
            self::Facebook => "https://www.facebook.com/{$handle}",
            self::YouTube => "https://www.youtube.com/@{$handle}",
        };
    }

    /**
     * @return list<self>
     */
    public static function enabledCases(): array
    {
        return array_values(array_filter(self::cases(), fn (self $provider) => $provider->enabled()));
    }
}
