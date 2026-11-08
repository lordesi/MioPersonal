<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * "Eventi": appointments with N places, organized by trainers and gyms
 * (workshops, open days, group trainings), and the places of the lessons of a
 * gym's course when the gym switches on "Prenotazione posto".
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('group_sessions', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 120)->unique();
            // The dates of "Ripeti ogni settimana" share it.
            $table->uuid('series_id')->nullable()->index();
            $table->string('type', 20);
            $table->string('title', 80);
            $table->text('description')->nullable();
            $table->string('cover_path')->nullable();
            $table->foreignId('discipline_id')->nullable()->constrained()->nullOnDelete();
            // Null only online.
            $table->foreignId('city_id')->nullable()->constrained()->nullOnDelete();
            $table->string('place', 20);
            $table->foreignId('gym_profile_id')->nullable()->constrained()->nullOnDelete();
            $table->string('address', 160)->nullable();
            $table->timestampTz('starts_at');
            $table->timestampTz('ends_at');
            $table->unsignedSmallInteger('capacity');
            // Places taken outside the app ("Posti rimasti" set by hand).
            $table->unsignedSmallInteger('offline_seats')->default(0);
            // 0 = free; paid at the place.
            $table->unsignedInteger('price_cents')->default(0);
            // A lesson of a course on a day; kept (cancelled) if the lesson is deleted.
            $table->foreignId('gym_course_lesson_id')->nullable()->constrained()->nullOnDelete();
            $table->date('lesson_date')->nullable();
            $table->string('status', 20)->default('published');
            $table->timestampTz('cancelled_at')->nullable();
            $table->string('cancel_note', 200)->nullable();
            // Hidden by the team.
            $table->timestampTz('hidden_at')->nullable();
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestampsTz();

            $table->index(['city_id', 'starts_at']);
            $table->index('starts_at');
            $table->unique(['gym_course_lesson_id', 'lesson_date']);
        });

        Schema::create('group_session_hosts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_session_id')->constrained()->cascadeOnDelete();
            // One of the two.
            $table->foreignId('trainer_profile_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('gym_profile_id')->nullable()->constrained()->cascadeOnDelete();
            $table->boolean('is_owner')->default(false);
            $table->string('status', 20);
            $table->timestampTz('responded_at')->nullable();
            $table->timestampsTz();

            $table->unique(['group_session_id', 'trainer_profile_id']);
            $table->unique(['group_session_id', 'gym_profile_id']);
        });

        Schema::create('group_session_registrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('status', 20);
            $table->timestampTz('reminded_day_before_at')->nullable();
            $table->timestampTz('reminded_soon_at')->nullable();
            $table->timestampsTz();

            $table->unique(['group_session_id', 'user_id']);
            $table->index(['user_id', 'status']);
        });

        Schema::table('gym_courses', function (Blueprint $table) {
            $table->boolean('bookable')->default(false)->after('is_active');
        });
    }

    public function down(): void
    {
        Schema::table('gym_courses', function (Blueprint $table) {
            $table->dropColumn('bookable');
        });

        Schema::dropIfExists('group_session_registrations');
        Schema::dropIfExists('group_session_hosts');
        Schema::dropIfExists('group_sessions');
    }
};
