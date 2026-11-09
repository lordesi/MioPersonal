<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * "Collega Google Calendar": the Google account a trainer linked, with the
 * tokens (encrypted) to write on a calendar "MioPersonal" made just for the
 * app, and which Google event belongs to which session.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trainer_calendar_connections', function (Blueprint $table) {
            $table->id();
            // One Google account for one trainer.
            $table->foreignId('trainer_profile_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('google_user_id', 100);
            $table->string('google_email', 255);
            // Encrypted by the model.
            $table->text('access_token');
            $table->text('refresh_token')->nullable();
            $table->timestamp('token_expires_at')->nullable();
            // The "MioPersonal" calendar made on the account; null until created.
            $table->string('calendar_id', 255)->nullable();
            // Why the last sync failed; shown with "Ricollega". Null = all fine.
            $table->string('last_error', 255)->nullable();
            $table->timestamp('connected_at');
            $table->timestamp('last_synced_at')->nullable();
            $table->timestamps();
        });

        Schema::create('calendar_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trainer_calendar_connection_id')->constrained()->cascadeOnDelete();
            // Exactly one of the two.
            $table->foreignId('booking_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('group_session_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('google_event_id', 255);
            $table->timestamps();

            $table->unique(['trainer_calendar_connection_id', 'booking_id'], 'calendar_events_booking_unique');
            $table->unique(['trainer_calendar_connection_id', 'group_session_id'], 'calendar_events_group_session_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('calendar_events');
        Schema::dropIfExists('trainer_calendar_connections');
    }
};
