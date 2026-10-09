<?php

namespace Tests\Feature;

use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LegalPagesTest extends TestCase
{
    /** @var array<string, string> route name => Inertia component */
    private const PAGES = [
        'legal.privacy' => 'public/privacy',
        'legal.terms' => 'public/terms',
        'legal.cookies' => 'public/cookies',
    ];

    public function test_everyone_can_read_the_legal_pages()
    {
        foreach (self::PAGES as $route => $component) {
            $this->get(route($route))
                ->assertOk()
                ->assertInertia(fn (Assert $page) => $page->component($component));
        }
    }

    public function test_the_urls_are_in_italian()
    {
        $this->assertSame('/privacy', route('legal.privacy', absolute: false));
        $this->assertSame('/termini', route('legal.terms', absolute: false));
        $this->assertSame('/cookie', route('legal.cookies', absolute: false));
    }
}
