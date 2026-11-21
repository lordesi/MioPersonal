<?php

namespace Tests\Unit;

use App\Support\ContentSecurityPolicy;
use PHPUnit\Framework\TestCase;

class ContentSecurityPolicyTest extends TestCase
{
    public function test_without_the_vite_dev_server_only_our_sources_are_allowed()
    {
        $policy = ContentSecurityPolicy::header('abc');

        $this->assertStringContainsString("script-src 'self' 'nonce-abc' https://static.cloudflareinsights.com;", $policy);
        $this->assertStringContainsString("connect-src 'self' https://*.ingest.de.sentry.io https://cloudflareinsights.com;", $policy);
        $this->assertStringNotContainsString('http:', $policy);
        $this->assertStringNotContainsString('ws:', $policy);
    }

    public function test_the_vite_dev_server_is_allowed_with_its_websocket()
    {
        $policy = ContentSecurityPolicy::header('abc', 'http://localhost:5173/');

        $this->assertStringContainsString("font-src 'self' data: http://localhost:5173;", $policy);
        $this->assertStringContainsString('http://localhost:5173 ws://localhost:5173;', $policy);
    }

    public function test_an_ipv6_dev_server_allows_the_scheme_because_csp_cannot_name_it()
    {
        $policy = ContentSecurityPolicy::header('abc', 'http://[::1]:5173');

        $this->assertStringContainsString("font-src 'self' data: http:;", $policy);
        $this->assertStringContainsString("'self' https://*.ingest.de.sentry.io https://cloudflareinsights.com http: ws:;", $policy);
        $this->assertStringNotContainsString('[::1]', $policy);
    }
}
