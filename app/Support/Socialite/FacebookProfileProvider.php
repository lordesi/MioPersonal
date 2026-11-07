<?php

namespace App\Support\Socialite;

use Laravel\Socialite\Two\FacebookProvider;

/**
 * "Collega Facebook": the built-in Facebook driver asking only for name and
 * the link of the profile (`user_link`, which needs Meta's App Review).
 */
class FacebookProfileProvider extends FacebookProvider
{
    /** @var list<string> */
    protected $scopes = ['public_profile', 'user_link'];

    /** @var list<string> */
    protected $fields = ['name', 'link'];
}
