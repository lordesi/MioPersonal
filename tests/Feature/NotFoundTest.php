<?php

namespace Tests\Feature;

use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class NotFoundTest extends TestCase
{
    public function test_unknown_addresses_show_our_404_page()
    {
        $this->get('/pagina-che-non-esiste')
            ->assertNotFound()
            ->assertInertia(fn (Assert $page) => $page->component('public/not-found'));
    }

    public function test_json_requests_still_get_a_json_404()
    {
        $this->getJson('/pagina-che-non-esiste')
            ->assertNotFound()
            ->assertJsonStructure(['message']);
    }
}
