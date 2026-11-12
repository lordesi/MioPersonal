<?php

use App\Rules\Username;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The username of every account, chosen once and never changed. For trainers
 * and gyms it is also the link of the page: the profile slug is a copy of it.
 *
 * Existing accounts get one now (trainers and gyms keep their link when they
 * can) and confirm it at the next visit. A link that changes is kept in
 * legacy_slug, so the QR codes already shared still open the page.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('username', Username::MAX)->nullable()->unique()->after('last_name');
            $table->timestamp('username_chosen_at')->nullable()->after('username');
        });

        foreach (['trainer_profiles', 'gym_profiles'] as $profiles) {
            Schema::table($profiles, function (Blueprint $table) {
                // The link before the username: redirects to the current one.
                $table->string('legacy_slug', 120)->nullable()->unique()->after('slug');
            });
        }

        // The pages first, so they keep their link; then everyone else.
        foreach (['trainer_profiles', 'gym_profiles'] as $profiles) {
            DB::table($profiles)
                ->join('users', 'users.id', '=', "{$profiles}.user_id")
                ->whereNull('users.username')
                ->orderBy("{$profiles}.id")
                ->select(["{$profiles}.id", "{$profiles}.slug", 'users.id as user_id'])
                ->get()
                ->each(function (object $profile) use ($profiles) {
                    $username = Username::freeFrom($profile->slug);

                    DB::table('users')->where('id', $profile->user_id)->update(['username' => $username]);

                    if ($username !== $profile->slug) {
                        DB::table($profiles)->where('id', $profile->id)->update(['slug' => $username, 'legacy_slug' => $profile->slug]);
                    }
                });
        }

        DB::table('users')
            ->whereNull('username')
            ->orderBy('id')
            ->get(['id', 'first_name', 'last_name'])
            ->each(fn (object $user) => DB::table('users')
                ->where('id', $user->id)
                ->update(['username' => Username::suggest((string) $user->first_name, (string) $user->last_name)]));
    }

    public function down(): void
    {
        foreach (['trainer_profiles', 'gym_profiles'] as $profiles) {
            DB::table($profiles)->whereNotNull('legacy_slug')->update(['slug' => DB::raw('legacy_slug')]);

            Schema::table($profiles, function (Blueprint $table) {
                $table->dropUnique(['legacy_slug']);
                $table->dropColumn('legacy_slug');
            });
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['username']);
            $table->dropColumn(['username', 'username_chosen_at']);
        });
    }
};
