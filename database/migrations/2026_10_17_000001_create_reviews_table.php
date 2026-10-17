<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Step 6 of docs/database/analisi.md (§3.7): the clients' reviews of a trainer.
 * The average stays in trainer_profiles.rating_count / rating_sum, refreshed
 * by TrainerProfile::refreshRating().
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            // The trainer closes the profile: its reviews go with it.
            $table->foreignId('trainer_profile_id')->constrained()->cascadeOnDelete();
            // One review per session. Empty for the demo reviews, until sessions can be marked as done.
            $table->foreignId('booking_id')->nullable()->unique()->constrained()->nullOnDelete();
            // Empty once the client deletes the account: the review stays, anonymous.
            $table->foreignId('client_id')->nullable()->constrained('users')->nullOnDelete();

            $table->unsignedTinyInteger('rating');
            $table->text('text');
            // The trainer's public answer.
            $table->text('reply')->nullable();
            $table->timestampTz('replied_at')->nullable();

            // Automatic warning for the team (a phone number, a link…).
            $table->string('flag_reason', 150)->nullable();
            // Hidden by the team: off the profile and the average, kept for disputes.
            $table->timestampTz('hidden_at')->nullable();
            $table->foreignId('hidden_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestampsTz();

            $table->index(['trainer_profile_id', 'created_at']);
        });

        // From 1 to 5 stars. PostgreSQL only: the tests run on SQLite.
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE reviews ADD CONSTRAINT reviews_rating_range CHECK (rating BETWEEN 1 AND 5)');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
