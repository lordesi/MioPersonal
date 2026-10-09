<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DevPagesTest extends TestCase
{
    public function test_dev_pages_are_not_available_outside_local()
    {
        $this->get('/dev/components')->assertNotFound();
        $this->get('/dev/layouts/trainer')->assertNotFound();
    }

    public function test_dev_pages_render_in_local()
    {
        $this->app['env'] = 'local';
        Route::middleware('web')->group(base_path('routes/dev.php'));

        $pages = [
            '/dev/components' => 'dev/components',
            '/dev/layouts/public' => 'dev/layouts/public',
            '/dev/layouts/trainer' => 'dev/layouts/trainer',
            '/dev/layouts/client' => 'dev/layouts/client',
        ];

        foreach ($pages as $url => $component) {
            $this->get($url)
                ->assertOk()
                ->assertInertia(fn (Assert $page) => $page->component($component));
        }
    }
}
