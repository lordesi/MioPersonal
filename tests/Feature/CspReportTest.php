<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Log;
use Illuminate\Testing\TestResponse;
use Mockery;
use Tests\TestCase;

class CspReportTest extends TestCase
{
    private function report(array $report, ?string $raw = null): TestResponse
    {
        return $this->call('POST', '/csp-report', [], [], [], [
            'CONTENT_TYPE' => 'application/csp-report',
        ], $raw ?? json_encode(['csp-report' => $report]));
    }

    private function violation(array $overrides = []): array
    {
        return [
            'document-uri' => 'https://miopersonal.it/reset-password/'.str_repeat('a1', 32).'?email=anna%40example.com',
            'effective-directive' => 'script-src-elem',
            'blocked-uri' => 'https://evil.example/x.js?session=secret',
            'source-file' => 'https://miopersonal.it/build/assets/app.js',
            'line-number' => 12,
            'disposition' => 'report',
            ...$overrides,
        ];
    }

    public function test_a_violation_is_logged_once_without_tokens_or_query_strings()
    {
        $logger = Mockery::mock();
        $logger->shouldReceive('warning')->once()->with('CSP violation', [
            'directive' => 'script-src-elem',
            'blocked' => 'https://evil.example/x.js',
            'page' => 'https://miopersonal.it/reset-password/{token}',
            'source' => 'https://miopersonal.it/build/assets/app.js',
            'line' => 12,
            'sample' => '',
            'disposition' => 'report',
        ]);
        Log::shouldReceive('channel')->with('csp')->once()->andReturn($logger);

        $this->report($this->violation())->assertNoContent();
        // The same violation again (every page load sends it): not logged twice.
        $this->report($this->violation())->assertNoContent();
    }

    public function test_keywords_like_inline_are_kept()
    {
        $logger = Mockery::mock();
        $logger->shouldReceive('warning')->once()->withArgs(fn ($message, $context) => $context['blocked'] === 'inline');
        Log::shouldReceive('channel')->with('csp')->andReturn($logger);

        $this->report($this->violation(['blocked-uri' => 'inline']))->assertNoContent();
    }

    public function test_it_needs_no_session_or_csrf_token_and_sets_no_cookie()
    {
        $response = $this->report($this->violation())->assertNoContent();

        $this->assertEmpty($response->headers->getCookies());
    }

    public function test_garbage_and_oversized_bodies_are_ignored()
    {
        Log::shouldReceive('channel')->never();

        $this->report([], 'not json')->assertNoContent();
        $this->report([], json_encode(['something' => 'else']))->assertNoContent();
        $this->report([], str_repeat('x', 20_000))->assertStatus(413);
    }

    public function test_one_address_cannot_flood_it()
    {
        Log::shouldReceive('channel')->andReturn(Mockery::mock()->shouldIgnoreMissing());

        for ($i = 0; $i < 30; $i++) {
            $this->report($this->violation(['line-number' => $i]))->assertNoContent();
        }

        $this->report($this->violation())->assertTooManyRequests();
    }
}
