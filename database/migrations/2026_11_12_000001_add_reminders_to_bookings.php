<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The reminders before a confirmed session (bookings:remind): when each one
 * was handled, so it goes out once. Both go back to null when the session
 * moves to another time.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            // The day before: client and trainer.
            $table->timestamp('reminded_day_before_at')->nullable();
            // About 2 hours before: the client, push only.
            $table->timestamp('reminded_soon_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['reminded_day_before_at', 'reminded_soon_at']);
        });
    }
};
