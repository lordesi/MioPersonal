<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * "Giorni e settimane diverse" of "Disponibilità": a day with its own hours,
 * or closed, instead of the weekly hours (`trainer_working_hours`). A week or
 * the holidays are one row per day. See App\Support\TrainerSlots::days().
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trainer_day_overrides', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trainer_profile_id')->constrained()->cascadeOnDelete();
            // The Rome date.
            $table->date('date');
            // Start hours as in the grid (6 … 23); [] = closed all day.
            $table->jsonb('hours');
            // "Ferie", "Gara": shown to the trainer only.
            $table->string('note', 60)->nullable();
            $table->timestampsTz();
            $table->unique(['trainer_profile_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trainer_day_overrides');
    }
};
