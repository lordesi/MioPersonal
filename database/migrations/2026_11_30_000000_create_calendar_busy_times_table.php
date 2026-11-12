<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * "Blocca gli orari occupati": the other way of "Collega Google Calendar",
 * optional. When it's on, the busy times of the trainer's Google calendars
 * are read (only when, never what) and those times can't be booked.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('trainer_calendar_connections', function (Blueprint $table) {
            // Null = off: nothing is read from Google.
            $table->timestamp('reads_busy_at')->nullable()->after('last_synced_at');
            $table->timestamp('busy_synced_at')->nullable()->after('reads_busy_at');
        });

        Schema::create('calendar_busy_times', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trainer_calendar_connection_id')->constrained()->cascadeOnDelete();
            // Only the time: no title, place or guests.
            $table->timestamp('starts_at');
            $table->timestamp('ends_at');
            $table->timestamps();

            $table->index(['trainer_calendar_connection_id', 'starts_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('calendar_busy_times');

        Schema::table('trainer_calendar_connections', function (Blueprint $table) {
            $table->dropColumn(['reads_busy_at', 'busy_synced_at']);
        });
    }
};
