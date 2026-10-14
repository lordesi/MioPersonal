<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Step 1 of docs/database/analisi.md: the account data the pages already ask for.
 * `name` is split into `first_name` + `last_name` (at the first space, like the
 * settings page did), then dropped: App\Models\User still offers `name` as
 * "Nome Cognome". The rows are copied in PHP so it works on PostgreSQL and on
 * the SQLite of the tests.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('first_name', 100)->nullable()->after('id');
            $table->string('last_name', 100)->nullable()->after('first_name');
            // Optional for clients; trainers show it to confirmed clients.
            $table->string('phone', 20)->nullable()->after('email');
            $table->string('avatar_path')->nullable();
            // Consents of the sign-up: when they were given.
            $table->timestamp('terms_accepted_at')->nullable();
            $table->timestamp('marketing_opt_in_at')->nullable();
            // The switches of "Notifiche"; null = the defaults of the design.
            $table->jsonb('notification_settings')->nullable();
            $table->timestamp('password_changed_at')->nullable();
            // "Admin · Utenti" → Sospendi.
            $table->timestamp('suspended_at')->nullable();
        });

        DB::table('users')->select(['id', 'name'])->orderBy('id')->each(function (object $user) {
            [$firstName, $lastName] = array_pad(explode(' ', trim((string) $user->name), 2), 2, '');

            DB::table('users')->where('id', $user->id)->update([
                'first_name' => $firstName,
                'last_name' => $lastName,
            ]);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->string('first_name', 100)->nullable(false)->change();
            $table->string('last_name', 100)->nullable(false)->change();
            $table->dropColumn('name');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('name')->nullable()->after('id');
        });

        DB::table('users')->select(['id', 'first_name', 'last_name'])->orderBy('id')->each(function (object $user) {
            DB::table('users')->where('id', $user->id)->update([
                'name' => trim($user->first_name.' '.$user->last_name),
            ]);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->string('name')->nullable(false)->change();
            $table->dropColumn([
                'first_name',
                'last_name',
                'phone',
                'avatar_path',
                'terms_accepted_at',
                'marketing_opt_in_at',
                'notification_settings',
                'password_changed_at',
                'suspended_at',
            ]);
        });
    }
};
