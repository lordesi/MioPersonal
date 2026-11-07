<?php

namespace App\Support\Socialite;

use GuzzleHttp\RequestOptions;
use Illuminate\Support\Arr;
use Laravel\Socialite\Two\GoogleProvider;
use Laravel\Socialite\Two\User;

/**
 * "Collega YouTube": a Google login that reads the channel of the account
 * (`youtube.readonly`). An account without a channel gives an empty id.
 */
class YouTubeProvider extends GoogleProvider
{
    /** @var list<string> */
    protected $scopes = ['openid', 'https://www.googleapis.com/auth/youtube.readonly'];

    /**
     * @return array<string, mixed>
     */
    protected function getUserByToken($token): array
    {
        $response = $this->getHttpClient()->get('https://www.googleapis.com/youtube/v3/channels', [
            RequestOptions::QUERY => ['part' => 'snippet', 'mine' => 'true'],
            RequestOptions::HEADERS => ['Accept' => 'application/json', 'Authorization' => 'Bearer '.$token],
        ]);

        return (array) Arr::get((array) json_decode((string) $response->getBody(), true), 'items.0', []);
    }

    /**
     * @param  array<string, mixed>  $user
     */
    protected function mapUserToObject(array $user): User
    {
        return (new User)->setRaw($user)->map([
            'id' => (string) Arr::get($user, 'id', ''),
            // "@giuliafit": the handle of the channel.
            'nickname' => ltrim((string) Arr::get($user, 'snippet.customUrl', ''), '@'),
            'name' => Arr::get($user, 'snippet.title'),
        ]);
    }
}
