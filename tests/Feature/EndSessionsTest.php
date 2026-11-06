<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\EndSessions;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class EndSessionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_others_keeps_only_the_current_session()
    {
        $user = User::factory()->create(['remember_token' => 'old-token']);
        $other = User::factory()->create();
        $this->addSession($current = str_repeat('a', 40), $user);
        $this->addSession('stolen', $user);
        $this->addSession('someone-else', $other);

        $request = Request::create('/');
        $request->setLaravelSession($session = app('session')->driver());
        $session->setId($current);

        EndSessions::others($user, $request);

        $this->assertSame([$current, 'someone-else'], DB::table('sessions')->orderBy('id')->pluck('id')->all());
        $this->assertNotSame('old-token', $user->fresh()->remember_token);
    }

    public function test_all_ends_every_session_of_the_user()
    {
        $user = User::factory()->create(['remember_token' => 'old-token']);
        $this->addSession('one', $user);
        $this->addSession('two', $user);

        EndSessions::all($user);

        $this->assertSame(0, DB::table('sessions')->count());
        $this->assertNotSame('old-token', $user->fresh()->remember_token);
    }

    private function addSession(string $id, User $user): void
    {
        DB::table('sessions')->insert([
            'id' => $id,
            'user_id' => $user->id,
            'ip_address' => '127.0.0.1',
            'user_agent' => 'test',
            'payload' => '',
            'last_activity' => now()->timestamp,
        ]);
    }
}
