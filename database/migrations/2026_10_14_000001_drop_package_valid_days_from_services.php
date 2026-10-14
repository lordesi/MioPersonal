<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Packages no longer expire ("Valido fino al…" was removed from the client
 * pages): the used sessions are counted from the bookings, nothing else.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->dropColumn('package_valid_days');
        });
    }

    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->unsignedSmallInteger('package_valid_days')->nullable()->after('package_sessions');
        });
    }
};
