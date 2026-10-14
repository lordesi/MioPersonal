<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The trainers a client saved with the heart (page "Preferiti").
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('favorites', function (Blueprint $table) {
            $table->foreignId('client_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('trainer_profile_id')->constrained()->cascadeOnDelete();
            $table->timestampTz('created_at')->nullable();

            // The same trainer can be saved only once.
            $table->primary(['client_id', 'trainer_profile_id']);
            $table->index('trainer_profile_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('favorites');
    }
};
