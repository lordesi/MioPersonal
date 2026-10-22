<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The goals the trainer works on (step 3 of "Diventa trainer" and "Modifica
 * profilo"), read by the "Obiettivo" filter of the search. Training goals
 * only, never health data.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('trainer_profiles', function (Blueprint $table) {
            // e.g. ["strength", "posture"]: App\Enums\TrainingGoal values. null = not chosen yet.
            $table->jsonb('goals')->nullable()->after('experience');
        });
    }

    public function down(): void
    {
        Schema::table('trainer_profiles', function (Blueprint $table) {
            $table->dropColumn('goals');
        });
    }
};
