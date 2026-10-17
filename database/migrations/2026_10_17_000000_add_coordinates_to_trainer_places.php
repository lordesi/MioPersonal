<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Where a studio is on the map: the "Zona" map of the public profile draws
 * its circle there. Found from the address with Nominatim (GeocodeTrainerPlace);
 * null until found, or for home, park and online, which have no address.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('trainer_places', function (Blueprint $table) {
            $table->decimal('lat', 9, 6)->nullable()->after('city_id');
            $table->decimal('lng', 9, 6)->nullable()->after('lat');
        });
    }

    public function down(): void
    {
        Schema::table('trainer_places', function (Blueprint $table) {
            $table->dropColumn(['lat', 'lng']);
        });
    }
};
