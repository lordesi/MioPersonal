<?php

namespace Tests;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Date;
use Laravel\Fortify\Features;

abstract class TestCase extends BaseTestCase
{
    protected function skipUnlessFortifyHas(string $feature, ?string $message = null): void
    {
        if (! Features::enabled($feature)) {
            $this->markTestSkipped($message ?? "Fortify feature [{$feature}] is not enabled.");
        }
    }

    /**
     * /admin asks for the password again (password.confirm): admins in tests
     * have just confirmed it. AdminTest checks the confirmation itself.
     */
    public function actingAs(Authenticatable $user, $guard = null)
    {
        if ($user instanceof User && $user->role === UserRole::Admin) {
            $this->withSession(['auth.password_confirmed_at' => Date::now()->unix()]);
        }

        return parent::actingAs($user, $guard);
    }
}
