<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class FloodProtectionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Route::middleware('web')->get('_flood-probe', fn (Request $request) => $request->ip());
    }

    public function test_behind_cloudflare_the_visitor_ip_is_the_forwarded_one()
    {
        $this->withServerVariables(['REMOTE_ADDR' => '172.64.10.20'])
            ->withHeader('X-Forwarded-For', '203.0.113.7')
            ->get('_flood-probe')
            ->assertOk()
            ->assertSee('203.0.113.7');
    }

    public function test_a_forwarded_ip_sent_straight_to_the_server_is_ignored()
    {
        $this->withServerVariables(['REMOTE_ADDR' => '198.51.100.9'])
            ->withHeader('X-Forwarded-For', '203.0.113.7')
            ->get('_flood-probe')
            ->assertOk()
            ->assertSee('198.51.100.9')
            ->assertDontSee('203.0.113.7');
    }

    public function test_a_guest_flooding_the_site_is_stopped_but_other_visitors_are_not()
    {
        $flood = fn () => $this->withServerVariables(['REMOTE_ADDR' => '172.64.10.20'])
            ->withHeader('X-Forwarded-For', '203.0.113.7')
            ->get('_flood-probe');

        for ($i = 0; $i < 120; $i++) {
            $flood()->assertOk();
        }

        $flood()->assertStatus(429);

        // Same Cloudflare node, another visitor: still served.
        $this->withServerVariables(['REMOTE_ADDR' => '172.64.10.20'])
            ->withHeader('X-Forwarded-For', '203.0.113.8')
            ->get('_flood-probe')
            ->assertOk();
    }

    public function test_signed_in_people_are_limited_by_account_not_by_ip()
    {
        $this->withServerVariables(['REMOTE_ADDR' => '198.51.100.9']);

        for ($i = 0; $i < 120; $i++) {
            $this->get('_flood-probe')->assertOk();
        }

        $this->get('_flood-probe')->assertStatus(429);

        // Someone on the same wifi, signed in: their own allowance.
        $this->actingAs(User::factory()->create())->get('_flood-probe')->assertOk();
    }
}
