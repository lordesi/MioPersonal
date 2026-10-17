<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * "Metti in pausa" in "Chiudi il profilo": a pause without an end. While
 * paused_at is set the profile is not in the search and nobody can book,
 * until the trainer presses "Riattiva profilo". The pause with dates
 * (paused_until) stays as it is.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('trainer_profiles', function (Blueprint $table) {
            // When the trainer paused the profile, in UTC; null = active.
            $table->timestampTz('paused_at')->nullable()->after('paused_until');
        });
    }

    public function down(): void
    {
        Schema::table('trainer_profiles', function (Blueprint $table) {
            $table->dropColumn('paused_at');
        });
    }
};
