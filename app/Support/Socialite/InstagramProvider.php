<?php

namespace App\Support\Socialite;

use GuzzleHttp\RequestOptions;
use Illuminate\Support\Arr;
use Laravel\Socialite\Two\AbstractProvider;
use Laravel\Socialite\Two\ProviderInterface;
use Laravel\Socialite\Two\User;

/**
 * "Collega Instagram": the Instagram API with Instagram Login, the one that
 * replaced the Basic Display API (closed in December 2024). It works only for
 * professional accounts (creator or business). We read id and username.
 */
class InstagramProvider extends AbstractProvider implements ProviderInterface
{
    /** @var list<string> */
    protected $scopes = ['instagram_business_basic'];

    protected $scopeSeparator = ',';

    protected function getAuthUrl($state): string
    {
        return $this->buildAuthUrlFromBase('https://www.instagram.com/oauth/authorize', $state);
    }

    protected function getTokenUrl(): string
    {
        return 'https://api.instagram.com/oauth/access_token';
    }

    /**
     * The answer is `{access_token, user_id, permissions}`, in some versions of
     * the API wrapped in `data: [...]`.
     *
     * @return array<string, mixed>
     */
    public function getAccessTokenResponse($code): array
    {
        $response = (array) parent::getAccessTokenResponse($code);

        return isset($response['data'][0]) && is_array($response['data'][0]) ? $response['data'][0] : $response;
    }

    /**
     * @return array<string, mixed>
     */
    protected function getUserByToken($token): array
    {
        $response = $this->getHttpClient()->get('https://graph.instagram.com/me', [
            RequestOptions::QUERY => ['fields' => 'user_id,username', 'access_token' => $token],
            RequestOptions::HEADERS => ['Accept' => 'application/json'],
        ]);

        return (array) json_decode((string) $response->getBody(), true);
    }

    /**
     * @param  array<string, mixed>  $user
     */
    protected function mapUserToObject(array $user): User
    {
        $username = Arr::get($user, 'username');

        return (new User)->setRaw($user)->map([
            'id' => (string) (Arr::get($user, 'user_id') ?? Arr::get($user, 'id')),
            'nickname' => $username,
            'name' => $username,
        ]);
    }
}
