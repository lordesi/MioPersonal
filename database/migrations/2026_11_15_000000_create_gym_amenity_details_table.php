<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * "Servizi" of a gym told better: a description and a photo for a service
 * the gym ticked (e.g. the Turkish bath). The list in `gym_profiles.amenities`
 * stays the one the search reads.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gym_amenity_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gym_profile_id')->constrained()->cascadeOnDelete();
            // App\Enums\GymAmenity
            $table->string('amenity', 30);
            $table->text('description')->nullable();
            $table->string('photo_path')->nullable();
            $table->timestampsTz();

            $table->unique(['gym_profile_id', 'amenity']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gym_amenity_details');
    }
};
