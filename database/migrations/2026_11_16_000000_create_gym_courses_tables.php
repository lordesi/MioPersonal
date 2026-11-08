<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * "Corsi" of a gym: each course with its weekly lessons, shown on the public
 * profile as the plan of the week. A lesson can be called off on one day.
 * Only shown: the place is booked at the gym.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gym_courses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gym_profile_id')->constrained()->cascadeOnDelete();
            $table->string('name', 80);
            $table->text('description')->nullable();
            $table->foreignId('discipline_id')->nullable()->constrained()->nullOnDelete();
            // App\Enums\CourseLevel
            $table->string('level', 20)->default('all');
            // A trainer of MioPersonal who works at the gym, or only a name.
            $table->foreignId('instructor_trainer_id')->nullable()->constrained('trainer_profiles')->nullOnDelete();
            $table->string('instructor_name', 80)->nullable();
            $table->string('photo_path')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort')->default(0);
            $table->timestampsTz();

            $table->index(['gym_profile_id', 'is_active']);
        });

        Schema::create('gym_course_lessons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gym_course_id')->constrained()->cascadeOnDelete();
            // 1 = Monday … 7 = Sunday, like gym_opening_hours.
            $table->unsignedTinyInteger('weekday');
            $table->time('starts_at');
            $table->time('ends_at');
            $table->string('room', 60)->nullable();
            $table->unsignedSmallInteger('capacity')->nullable();

            $table->index(['gym_course_id', 'weekday']);
        });

        Schema::create('gym_course_cancellations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gym_course_lesson_id')->constrained()->cascadeOnDelete();
            // The Rome day the lesson doesn't take place.
            $table->date('date');
            $table->string('note', 120)->nullable();
            $table->timestampsTz();

            $table->unique(['gym_course_lesson_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gym_course_cancellations');
        Schema::dropIfExists('gym_course_lessons');
        Schema::dropIfExists('gym_courses');
    }
};
