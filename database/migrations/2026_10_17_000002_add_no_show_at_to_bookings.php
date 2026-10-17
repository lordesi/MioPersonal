<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * "Saltata": a confirmed session is done as soon as it ends, unless the
 * trainer marks it as missed within 7 days (Booking::NO_SHOW_DAYS). The status
 * stays "confirmed": the client doesn't see it, it only feeds the attendance
 * rate the trainers see (App\Support\ClientAttendance).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            // When the trainer marked the client as absent, in UTC; null = done.
            $table->timestampTz('no_show_at')->nullable()->after('cancelled_by');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn('no_show_at');
        });
    }
};
