<?php

namespace Tests\Feature;

use App\Enums\TrainerProfileStatus;
use App\Models\TrainerProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * The pings of App\Support\IndexNow when a public page changes, and the key
 * file that proves they are ours.
 */
class IndexNowTest extends TestCase
{
    use RefreshDatabase;

    private const KEY = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6';

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutDefer();
        Http::fake(['api.indexnow.org/*' => Http::response(status: 200)]);
    }

    private function live(): void
    {
        config(['services.indexnow.key' => self::KEY]);
        $this->app['env'] = 'production';
    }

    public function test_the_key_file_is_served_only_for_the_key()
    {
        $this->get('/'.self::KEY.'.txt')->assertNotFound();

        config(['services.indexnow.key' => self::KEY]);

        $this->get('/'.self::KEY.'.txt')->assertOk()->assertContent(self::KEY);
        $this->get('/b1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6.txt')->assertNotFound();
    }

    public function test_an_edited_public_profile_is_sent_once()
    {
        $profile = TrainerProfile::factory()->approved()->create();
        $this->live();

        $profile->update(['headline' => 'Pilates e postura a Milano']);
        // Saved again a moment later: already sent.
        $profile->update(['headline' => 'Pilates e postura a Milano centro']);

        Http::assertSentCount(1);
        Http::assertSent(fn (Request $request) => $request['key'] === self::KEY
            && $request['urlList'] === [route('trainers.show', $profile->slug)]
            && $request['keyLocation'] === route('indexnow.key', self::KEY));
    }

    public function test_no_ping_for_internal_fields_profiles_under_review_or_without_a_key()
    {
        $profile = TrainerProfile::factory()->approved()->create();
        $pending = TrainerProfile::factory()->create(['status' => TrainerProfileStatus::Review]);

        // No key (local, tests, staging): nothing leaves.
        $profile->update(['headline' => 'Nuovo titolo']);

        $this->live();
        // Fields the site updates by itself.
        $profile->forceFill(['rating_count' => 3, 'rating_sum' => 15])->save();
        // Not public yet: its address must not reach search engines.
        $pending->update(['headline' => 'In attesa']);

        Http::assertNothingSent();
    }
}
