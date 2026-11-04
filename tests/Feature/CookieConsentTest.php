<?php

namespace Tests\Feature;

use App\Models\CookieConsent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CookieConsentTest extends TestCase
{
    use RefreshDatabase;

    private function consentCookie(string $version = CookieConsent::POLICY_VERSION): string
    {
        return (string) json_encode([
            'id' => '0b6c1c2e-8f3a-4d1e-9a51-6f1f2a3b4c5d',
            'version' => $version,
            'analytics' => true,
            'marketing' => false,
        ]);
    }

    public function test_without_a_choice_the_banner_is_shown()
    {
        $this->get(route('legal.cookies'))
            ->assertInertia(fn (Assert $page) => $page->where('cookieConsent', null));
    }

    public function test_a_guest_choice_is_saved_as_proof_and_in_the_cookie()
    {
        $response = $this->from(route('legal.privacy'))
            ->post(route('cookie-consent.store'), ['analytics' => true, 'marketing' => false])
            ->assertRedirect(route('legal.privacy'))
            ->assertCookie(CookieConsent::COOKIE);

        $consent = CookieConsent::sole();
        $this->assertNull($consent->user_id);
        $this->assertSame(CookieConsent::POLICY_VERSION, $consent->policy_version);
        $this->assertTrue($consent->analytics);
        $this->assertFalse($consent->marketing);

        $cookie = json_decode((string) $response->getCookie(CookieConsent::COOKIE)?->getValue(), true);
        $this->assertSame([
            'id' => $consent->consent_id,
            'version' => CookieConsent::POLICY_VERSION,
            'analytics' => true,
            'marketing' => false,
        ], $cookie);
    }

    public function test_a_logged_in_choice_keeps_the_user_and_the_browser_id()
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->withCookie(CookieConsent::COOKIE, $this->consentCookie())
            ->post(route('cookie-consent.store'), ['analytics' => false, 'marketing' => false])
            ->assertRedirect();

        $consent = CookieConsent::sole();
        $this->assertSame($user->id, $consent->user_id);
        $this->assertSame('0b6c1c2e-8f3a-4d1e-9a51-6f1f2a3b4c5d', $consent->consent_id);
    }

    public function test_the_choice_must_be_complete()
    {
        $this->post(route('cookie-consent.store'), ['analytics' => 'forse'])
            ->assertSessionHasErrors(['analytics', 'marketing']);

        $this->assertSame(0, CookieConsent::count());
    }

    public function test_the_saved_choice_is_shared_with_the_pages()
    {
        $this->withCookie(CookieConsent::COOKIE, $this->consentCookie())
            ->get(route('legal.cookies'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('cookieConsent.analytics', true)
                ->where('cookieConsent.marketing', false)
            );
    }

    public function test_a_choice_for_an_old_policy_shows_the_banner_again()
    {
        $this->withCookie(CookieConsent::COOKIE, $this->consentCookie('2020-01'))
            ->get(route('legal.cookies'))
            ->assertInertia(fn (Assert $page) => $page->where('cookieConsent', null));
    }
}
