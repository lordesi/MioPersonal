<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Sleep;
use Laravel\Fortify\Features;

abstract class TestCase extends BaseTestCase
{
    /**
     * What the fake Nominatim answers (see App\Support\Geocoder): nothing found,
     * unless a test puts a result here, e.g.
     * [['lat' => '45.47', 'lon' => '9.18', 'address' => ['city' => 'Milano']]].
     *
     * @var list<array{lat: string, lon: string, address: array<string, string>}>
     */
    protected array $nominatimResults = [];

    protected function setUp(): void
    {
        parent::setUp();

        // The tests never call internet, nor wait the second between two requests.
        Http::fake(['nominatim.openstreetmap.org/*' => fn () => Http::response($this->nominatimResults)]);
        Sleep::fake();
    }

    protected function skipUnlessFortifyHas(string $feature, ?string $message = null): void
    {
        if (! Features::enabled($feature)) {
            $this->markTestSkipped($message ?? "Fortify feature [{$feature}] is not enabled.");
        }
    }
}
