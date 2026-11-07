<?php

namespace App\Support\Socialite;

use GuzzleHttp\RequestOptions;
use Illuminate\Support\Arr;
use Laravel\Socialite\Two\AbstractProvider;
use Laravel\Socialite\Two\ProviderInterface;
use Laravel\Socialite\Two\User;

/**
 * "Collega TikTok": Login Kit v2. TikTok calls the client id "client_key";
 * `user.info.profile` is needed for the username.
 */
class TikTokProvider extends AbstractProvider implements ProviderInterface
{
    /** @var list<string> */
    protected $scopes = ['user.info.basic', 'user.info.profile'];

    protected $scopeSeparator = ',';

    protected function getAuthUrl($state): string
    {
        return $this->buildAuthUrlFromBase('https://www.tiktok.com/v2/auth/authorize/', $state);
    }

    /**
     * @param  string|null  $state
     * @return array<string, mixed>
     */
    protected function getCodeFields($state = null): array
    {
        $fields = parent::getCodeFields($state);
        $fields['client_key'] = $fields['client_id'];
        unset($fields['client_id']);

        return $fields;
    }

    protected function getTokenUrl(): string
    {
        return 'https://open.tiktokapis.com/v2/oauth/token/';
    }

    /**
     * @param  string  $code
     * @return array<string, mixed>
     */
    protected function getTokenFields($code): array
    {
        $fields = parent::getTokenFields($code);
        $fields['client_key'] = $fields['client_id'];
        unset($fields['client_id']);

        return $fields;
    }

    /**
     * @return array<string, mixed>
     */
    protected function getUserByToken($token): array
    {
        $response = $this->getHttpClient()->get('https://open.tiktokapis.com/v2/user/info/', [
            RequestOptions::QUERY => ['fields' => 'open_id,display_name,username'],
            RequestOptions::HEADERS => ['Authorization' => 'Bearer '.$token],
        ]);

        return (array) Arr::get((array) json_decode((string) $response->getBody(), true), 'data.user', []);
    }

    /**
     * @param  array<string, mixed>  $user
     */
    protected function mapUserToObject(array $user): User
    {
        return (new User)->setRaw($user)->map([
            'id' => (string) Arr::get($user, 'open_id'),
            'nickname' => Arr::get($user, 'username'),
            'name' => Arr::get($user, 'display_name'),
        ]);
    }
}
