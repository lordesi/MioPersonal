<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * "Ripeti ogni settimana": the client asks for the same day and time every
 * week. The trainer accepts it as "sedute fisse" (BookingSeries), or only
 * this session.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->boolean('repeat_weekly')->default(false)->after('booking_series_id');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn('repeat_weekly');
        });
    }
};
