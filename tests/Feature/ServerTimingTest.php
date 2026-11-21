<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ServerTimingTest extends TestCase
{
    use RefreshDatabase;

    private const HEADER = '/^app;dur=\d+\.\d;desc="PHP", db;dur=\d+\.\d;desc="(\d+) query", db1;dur=\d+\.\d;desc="prima query \(apre la connessione\)"$/';

    public function test_pages_tell_how_long_the_server_took()
    {
        $header = (string) $this->get(route('home'))->assertOk()->headers->get('Server-Timing');

        $this->assertMatchesRegularExpression(self::HEADER, $header);
    }

    public function test_the_queries_of_the_page_are_counted()
    {
        $user = User::factory()->create();

        $header = (string) $this->actingAs($user)->get(route('home'))->headers->get('Server-Timing');

        preg_match(self::HEADER, $header, $match);
        $this->assertGreaterThan(0, (int) ($match[1] ?? 0));
    }

    public function test_redirects_and_missing_pages_have_it_too()
    {
        $this->get(route('client.home'))->assertRedirect()->assertHeader('Server-Timing');
        $this->get('/questa-pagina-non-esiste')->assertNotFound()->assertHeader('Server-Timing');
    }
}
