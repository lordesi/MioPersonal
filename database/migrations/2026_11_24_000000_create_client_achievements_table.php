<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * "Traguardi" of "Panoramica" (App\Enums\Achievement): each one reached once,
 * kept even if the trainings behind it are deleted later. `trainer_profile_id`:
 * the trainer it was reached with, named on the image for the stories.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('client_achievements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('key', 40);
            $table->timestamp('earned_at');
            $table->foreignId('trainer_profile_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();

            $table->unique(['user_id', 'key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_achievements');
    }
};
