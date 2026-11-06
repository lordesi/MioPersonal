<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * "Su di te" of "Completa il tuo profilo": what the client tells the trainers
 * they book (age, level, habits, sports, a note). All optional.
 *
 * Height and weight can tell something about health (GDPR art. 9): they are
 * saved only with the separate consent `body_data_consent_at`, withdrawing it
 * deletes them, and only the trainers the client booked can read them.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('client_preferences', function (Blueprint $table) {
            // The year only: the trainer sees the age, never the full date.
            $table->unsignedSmallInteger('birth_year')->nullable();
            // See App\Enums\Sex, FitnessLevel, TrainingExperience, ActivityLevel.
            $table->enum('sex', ['female', 'male', 'other'])->nullable();
            $table->enum('fitness_level', ['beginner', 'intermediate', 'advanced'])->nullable();
            $table->enum('training_experience', ['never', 'under_1', '1_3', '3_5', 'over_5'])->nullable();
            $table->enum('activity_level', ['sedentary', 'light', 'active', 'very_active'])->nullable();
            // "Quante volte a settimana vorresti allenarti".
            $table->unsignedSmallInteger('sessions_per_week')->nullable();
            // Sports done now or in the past, written by the client ("Calcio", "Nuoto").
            $table->jsonb('sports')->nullable();
            // "Cosa vorresti che il trainer sapesse": with the warning about health data.
            $table->text('trainer_note')->nullable();
            $table->unsignedSmallInteger('height_cm')->nullable();
            $table->unsignedSmallInteger('weight_kg')->nullable();
            $table->timestampTz('body_data_consent_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('client_preferences', function (Blueprint $table) {
            $table->dropColumn([
                'birth_year', 'sex', 'fitness_level', 'training_experience', 'activity_level',
                'sessions_per_week', 'sports', 'trainer_note', 'height_cm', 'weight_kg', 'body_data_consent_at',
            ]);
        });
    }
};
