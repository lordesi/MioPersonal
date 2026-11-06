<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * "Elimina account" and "Cancella dati" of the admin: the account is blocked
 * right away and deleted 30 days later (`users:purge-deleted`), so there is
 * time to change one's mind.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('deletion_scheduled_at')->nullable()->index();
            // 'user' = from the settings, the user can take it back by logging in;
            // 'admin' = only the team can.
            $table->string('deletion_requested_by', 10)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['deletion_scheduled_at']);
            $table->dropColumn(['deletion_scheduled_at', 'deletion_requested_by']);
        });
    }
};
