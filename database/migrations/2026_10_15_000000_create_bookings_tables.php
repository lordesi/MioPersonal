<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Step 5 of docs/database/analisi.md: the bookings and their history.
 * Packages (`client_packages`) come later.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            // Empty once the client deletes the account: the trainer keeps the past sessions.
            $table->foreignId('client_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('trainer_profile_id')->constrained()->cascadeOnDelete();
            $table->foreignId('service_id')->nullable()->constrained()->nullOnDelete();

            $table->timestampTz('starts_at');
            $table->timestampTz('ends_at');
            // End + the trainer's break: nobody can book before this moment.
            $table->timestampTz('blocked_until');

            // Copied when booking: if the trainer changes the service, old bookings stay the same.
            $table->string('service_name', 100);
            $table->unsignedInteger('price_cents');
            $table->string('place_label', 150);

            // See App\Enums\BookingStatus and App\Enums\BookingActor.
            $table->enum('status', ['pending', 'confirmed', 'declined', 'cancelled', 'expired'])->default('pending');
            // Only for "pending": after this moment the request expires and the slot is free again.
            $table->timestampTz('expires_at')->nullable();
            $table->timestampTz('confirmed_at')->nullable();
            $table->timestampTz('cancelled_at')->nullable();
            $table->enum('cancelled_by', ['client', 'trainer', 'system'])->nullable();
            // Never health data: see CLAUDE.md.
            $table->text('client_note')->nullable();
            $table->timestampsTz();

            $table->index(['client_id', 'starts_at']);
            $table->index(['trainer_profile_id', 'starts_at']);
            $table->index(['status', 'expires_at']);
        });

        // Two active bookings of the same trainer can never overlap, not even when two
        // clients click the same slot in the same second (analisi.md §4.3).
        // PostgreSQL only: the tests run on SQLite, where the code check is enough.
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('CREATE EXTENSION IF NOT EXISTS btree_gist');
            DB::statement(<<<'SQL'
                ALTER TABLE bookings ADD CONSTRAINT bookings_no_overlap
                EXCLUDE USING gist (
                    trainer_profile_id WITH =,
                    tstzrange(starts_at, blocked_until) WITH &&
                ) WHERE (status IN ('pending', 'confirmed'))
                SQL);
        }

        // What happened to each booking, and who did it.
        Schema::create('booking_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['requested', 'confirmed', 'declined', 'cancelled', 'expired']);
            // Empty for the automatic ones (expiry) and once the user is deleted.
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestampTz('created_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_events');
        Schema::dropIfExists('bookings');
    }
};
