<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Step 3 of docs/database/analisi.md: the trainer profiles and everything the
 * registration collects (disciplines, cities, places, services, photo,
 * certifications, working hours), plus the team's decisions in "Admin · Verifica".
 * Deleting a profile deletes all its rows ("Chiudi il profilo").
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trainer_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            // In the URL: /trainer/{slug}
            $table->string('slug', 120)->unique();
            $table->string('headline', 60);
            $table->text('bio');
            // Years of experience: see App\Enums\TrainerExperience.
            $table->enum('experience', ['lt2', '2to5', '5to10', 'gt10']);
            // Main city; empty for online-only trainers. A city is hidden, never deleted.
            $table->foreignId('city_id')->nullable()->constrained()->restrictOnDelete();

            // Approval by the team: see App\Enums\TrainerProfileStatus.
            $table->enum('status', ['review', 'changes', 'approved', 'rejected'])->default('review');
            $table->timestampTz('status_changed_at')->nullable();
            $table->timestampTz('approved_at')->nullable();

            // "Visibilità del profilo" in the trainer settings.
            $table->boolean('visible_in_search')->default(true);
            $table->boolean('accepts_new_clients')->default(true);
            $table->timestampTz('paused_until')->nullable();

            // Booking rules (step 5 of the registration).
            $table->unsignedSmallInteger('notice_hours')->default(12);
            $table->unsignedSmallInteger('booking_window_days')->default(60);
            $table->unsignedSmallInteger('break_minutes')->default(15);
            $table->unsignedSmallInteger('travel_minutes')->default(30);
            $table->unsignedSmallInteger('max_sessions_per_day')->default(6);
            $table->unsignedSmallInteger('free_cancellation_hours')->default(24);
            $table->unsignedSmallInteger('confirm_hours')->default(24);
            $table->boolean('auto_confirm')->default(false);
            $table->boolean('allows_one_hour')->default(true);
            $table->boolean('allows_two_hours')->default(true);

            // "Contatti per i clienti": what clients see after the confirmation.
            $table->boolean('show_phone')->default(true);
            $table->boolean('show_email')->default(true);
            $table->boolean('show_whatsapp')->default(false);
            $table->text('arrival_notes')->nullable();

            // Computed fields, kept up to date by the app so the search is one simple query.
            $table->boolean('trains_online')->default(false);
            $table->boolean('trains_in_person')->default(false);
            $table->unsignedInteger('price_from_cents')->nullable();
            $table->timestampTz('next_free_slot_at')->nullable();
            $table->unsignedInteger('rating_count')->default(0);
            $table->unsignedInteger('rating_sum')->default(0);
            $table->unsignedInteger('response_minutes')->nullable();

            $table->timestampsTz();

            $table->index(['status', 'visible_in_search', 'next_free_slot_at']);
        });

        // The trainer's disciplines (at most 5), in the trainer's order.
        Schema::create('trainer_profile_discipline', function (Blueprint $table) {
            $table->foreignId('trainer_profile_id')->constrained()->cascadeOnDelete();
            // A discipline is hidden, never deleted, while trainers use it.
            $table->foreignId('discipline_id')->constrained()->restrictOnDelete();
            $table->unsignedSmallInteger('sort')->default(0);
            $table->primary(['trainer_profile_id', 'discipline_id']);
            $table->index('discipline_id');
        });

        // The other cities where the trainer goes (home and park sessions).
        Schema::create('trainer_profile_city', function (Blueprint $table) {
            $table->foreignId('trainer_profile_id')->constrained()->cascadeOnDelete();
            $table->foreignId('city_id')->constrained()->restrictOnDelete();
            $table->primary(['trainer_profile_id', 'city_id']);
            $table->index('city_id');
        });

        // Where the trainer works: one row per studio, one for each other type.
        Schema::create('trainer_places', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trainer_profile_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['studio', 'home', 'park', 'online']);
            // Only for studios.
            $table->string('name', 100)->nullable();
            $table->string('address', 200)->nullable();
            $table->foreignId('city_id')->nullable()->constrained()->restrictOnDelete();
            $table->unsignedSmallInteger('sort')->default(0);
            $table->timestampsTz();
        });

        // "Servizi e prezzi". Prices in whole cents, payment outside the platform.
        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trainer_profile_id')->constrained()->cascadeOnDelete();
            $table->string('name', 100);
            $table->enum('kind', ['session', 'package'])->default('session');
            $table->unsignedSmallInteger('minutes');
            $table->unsignedInteger('price_cents');
            // The price is per hour: 2 hours cost twice as much.
            $table->boolean('price_per_hour')->default(false);
            // Bookable only for its own duration.
            $table->boolean('fixed_duration')->default(true);
            $table->string('note', 200)->nullable();
            $table->boolean('online_only')->default(false);
            // Only for packages.
            $table->unsignedSmallInteger('package_sessions')->nullable();
            $table->unsignedSmallInteger('package_valid_days')->nullable();
            $table->unsignedSmallInteger('sort')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestampsTz();
        });

        // Photos on the public disk. For now only the profile photo (is_portrait).
        Schema::create('trainer_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trainer_profile_id')->constrained()->cascadeOnDelete();
            $table->string('path');
            $table->string('caption', 100)->nullable();
            $table->boolean('is_portrait')->default(false);
            $table->unsignedSmallInteger('sort')->default(0);
            $table->timestampsTz();
        });

        // Certifications; the file is on the private disk, only the team opens it.
        Schema::create('trainer_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trainer_profile_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['identity', 'certificate'])->default('certificate');
            $table->string('title', 150);
            $table->string('issuer', 150)->nullable();
            $table->unsignedSmallInteger('year')->nullable();
            // Deleted after the team's decision: title and issuer stay on the profile.
            $table->string('path')->nullable();
            $table->timestampTz('verified_at')->nullable();
            $table->unsignedSmallInteger('sort')->default(0);
            $table->timestampsTz();
        });

        // History of the team's decisions in "Admin · Verifica".
        Schema::create('trainer_profile_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trainer_profile_id')->constrained()->cascadeOnDelete();
            // Empty if the admin account is deleted: the decision stays.
            $table->foreignId('admin_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('decision', ['approved', 'changes', 'rejected', 'undone']);
            // The chips of "Cosa deve sistemare?".
            $table->jsonb('reasons')->nullable();
            $table->text('message_to_trainer')->nullable();
            $table->text('internal_note')->nullable();
            $table->timestampTz('created_at')->nullable();
            $table->index(['trainer_profile_id', 'created_at']);
        });

        // Weekly working hours, in Rome time: "18:00" stays 18:00 when the clocks change.
        Schema::create('trainer_working_hours', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trainer_profile_id')->constrained()->cascadeOnDelete();
            // 1 = Monday … 7 = Sunday (ISO).
            $table->unsignedTinyInteger('weekday');
            $table->time('starts_at');
            $table->time('ends_at');
            $table->index(['trainer_profile_id', 'weekday']);
        });

        // SQLite (tests) can't add constraints to an existing table.
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE trainer_working_hours ADD CONSTRAINT trainer_working_hours_weekday_check CHECK (weekday BETWEEN 1 AND 7)');
            DB::statement('ALTER TABLE trainer_working_hours ADD CONSTRAINT trainer_working_hours_range_check CHECK (starts_at < ends_at)');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('trainer_working_hours');
        Schema::dropIfExists('trainer_profile_reviews');
        Schema::dropIfExists('trainer_documents');
        Schema::dropIfExists('trainer_photos');
        Schema::dropIfExists('services');
        Schema::dropIfExists('trainer_places');
        Schema::dropIfExists('trainer_profile_city');
        Schema::dropIfExists('trainer_profile_discipline');
        Schema::dropIfExists('trainer_profiles');
    }
};
