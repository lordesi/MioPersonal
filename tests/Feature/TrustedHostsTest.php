<?php

namespace Tests\Feature;

use App\Providers\AppServiceProvider;
use Illuminate\Http\Middleware\TrustHosts;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Symfony\Component\HttpFoundation\Exception\SuspiciousOperationException;
use Tests\TestCase;

/** A forged Host header must not end up in the links of our emails. */
class TrustedHostsTest extends TestCase
{
    public function test_in_production_links_use_app_url_whatever_the_host_header()
    {
        config(['app.url' => 'https://miopersonal.it']);
        $this->app->detectEnvironment(fn () => 'production');
        (new AppServiceProvider($this->app))->boot();

        URL::setRequest(Request::create('http://evil.example/forgot-password'));

        $url = route('password.reset', ['token' => 'abc', 'email' => 'giulia@example.com']);

        $this->assertStringStartsWith('https://miopersonal.it/', $url);
    }

    public function test_requests_for_other_hosts_are_refused()
    {
        config(['app.url' => 'https://miopersonal.it']);

        // As in production: the middleware is off while testing.
        $middleware = new class($this->app) extends TrustHosts
        {
            protected function shouldSpecifyTrustedHosts()
            {
                return true;
            }
        };

        $next = fn (Request $request) => response($request->getHost());

        $this->assertSame('www.miopersonal.it', $middleware->handle(Request::create('https://www.miopersonal.it/'), $next)->getContent());

        $this->expectException(SuspiciousOperationException::class);
        $middleware->handle(Request::create('https://evil.example/'), $next);
    }
}
