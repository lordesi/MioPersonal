<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The "Zona" map is gone from the public profile: the studios no longer
 * need their coordinates.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('trainer_places', function (Blueprint $table) {
            $table->dropColumn(['lat', 'lng']);
        });
    }

    public function down(): void
    {
        Schema::table('trainer_places', function (Blueprint $table) {
            $table->decimal('lat', 9, 6)->nullable()->after('city_id');
            $table->decimal('lng', 9, 6)->nullable()->after('lat');
        });
    }
};
