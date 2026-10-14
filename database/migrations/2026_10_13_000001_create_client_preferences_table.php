<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Part of step 7 of docs/database/analisi.md: the answers of "Completa il tuo
 * profilo". One row per client, deleted with the account. Only training
 * preferences: never health data.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('client_preferences', function (Blueprint $table) {
            $table->foreignId('user_id')->primary()->constrained()->cascadeOnDelete();
            // A city is hidden, never deleted.
            $table->foreignId('city_id')->nullable()->constrained()->restrictOnDelete();
            // See App\Enums\TrainingMode and App\Enums\TrainingGoal.
            $table->enum('mode', ['in_person', 'online', 'both'])->nullable();
            $table->enum('goal', ['fitness', 'strength', 'posture', 'sport', 'wellbeing'])->nullable();
            // Lists: App\Enums\PreferredTime values and discipline ids.
            $table->jsonb('times')->nullable();
            $table->jsonb('discipline_ids')->nullable();
            // "Budget indicativo a seduta": the most the client wants to spend.
            $table->unsignedInteger('budget_max_cents')->nullable();
            $table->timestampsTz();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_preferences');
    }
};
