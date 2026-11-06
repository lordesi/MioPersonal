<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The gyms a client saved with the heart (page "Preferiti", tab "Palestre").
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gym_favorites', function (Blueprint $table) {
            $table->foreignId('client_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('gym_profile_id')->constrained()->cascadeOnDelete();
            $table->timestampTz('created_at')->nullable();

            // The same gym can be saved only once.
            $table->primary(['client_id', 'gym_profile_id']);
            $table->index('gym_profile_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gym_favorites');
    }
};
