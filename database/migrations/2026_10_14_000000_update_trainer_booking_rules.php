<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * New booking rules of "Orari e regole":
 * - the bookable durations become a list of minutes (30 min … 3 hours)
 *   instead of the two switches "1 ora" / "2 ore";
 * - "Massimo sedute al giorno" can be "Nessun limite" (null);
 * - "Spostamento per il domicilio" is gone.
 * The rows are copied in PHP so it works on PostgreSQL and on the SQLite of the tests.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('trainer_profiles', function (Blueprint $table) {
            // e.g. [60, 120]: the durations clients can book, in minutes.
            $table->jsonb('session_minutes')->nullable();
        });

        DB::table('trainer_profiles')->select(['id', 'allows_one_hour', 'allows_two_hours'])->orderBy('id')->each(function (object $profile) {
            $minutes = array_values(array_filter([
                $profile->allows_one_hour ? 60 : null,
                $profile->allows_two_hours ? 120 : null,
            ]));

            DB::table('trainer_profiles')->where('id', $profile->id)->update([
                'session_minutes' => json_encode($minutes ?: [60]),
            ]);
        });

        Schema::table('trainer_profiles', function (Blueprint $table) {
            $table->jsonb('session_minutes')->nullable(false)->change();
            // null = "Nessun limite".
            $table->unsignedSmallInteger('max_sessions_per_day')->nullable()->default(6)->change();
            $table->dropColumn(['allows_one_hour', 'allows_two_hours', 'travel_minutes']);
        });
    }

    public function down(): void
    {
        Schema::table('trainer_profiles', function (Blueprint $table) {
            $table->unsignedSmallInteger('travel_minutes')->default(30);
            $table->boolean('allows_one_hour')->default(true);
            $table->boolean('allows_two_hours')->default(true);
        });

        DB::table('trainer_profiles')->select(['id', 'session_minutes', 'max_sessions_per_day'])->orderBy('id')->each(function (object $profile) {
            $minutes = json_decode((string) $profile->session_minutes, true) ?: [];

            DB::table('trainer_profiles')->where('id', $profile->id)->update([
                'allows_one_hour' => in_array(60, $minutes, true),
                'allows_two_hours' => in_array(120, $minutes, true),
                'max_sessions_per_day' => $profile->max_sessions_per_day ?? 10,
            ]);
        });

        Schema::table('trainer_profiles', function (Blueprint $table) {
            $table->unsignedSmallInteger('max_sessions_per_day')->nullable(false)->default(6)->change();
            $table->dropColumn('session_minutes');
        });
    }
};
