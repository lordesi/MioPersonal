<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SecurityHeadersTest extends TestCase
{
    use RefreshDatabase;

    public function test_pages_cannot_be_framed_and_have_the_security_headers()
    {
        $this->get(route('home'))
            ->assertOk()
            ->assertHeader('X-Frame-Options', 'DENY')
            ->assertHeader('Content-Security-Policy', "frame-ancestors 'none'")
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
            ->assertHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self), payment=(), usb=()')
            ->assertHeaderMissing('Strict-Transport-Security');
    }

    public function test_pages_of_logged_in_users_are_never_cached()
    {
        $this->assertStringNotContainsString('no-store', (string) $this->get(route('home'))->headers->get('Cache-Control'));

        $response = $this->actingAs(User::factory()->create())->get(route('home'));

        $this->assertStringContainsString('no-store', (string) $response->headers->get('Cache-Control'));
    }

    public function test_hsts_only_in_production_over_https()
    {
        $this->app->detectEnvironment(fn () => 'production');

        // A host of APP_URL: in production the others are refused (trustHosts).
        $this->get('https://'.parse_url(config()->string('app.url'), PHP_URL_HOST).'/')
            ->assertHeader('Strict-Transport-Security', 'max-age=31536000');
    }

    public function test_the_404_page_has_them_too()
    {
        $this->get('/pagina-che-non-esiste')
            ->assertNotFound()
            ->assertHeader('X-Frame-Options', 'DENY');
    }
}
