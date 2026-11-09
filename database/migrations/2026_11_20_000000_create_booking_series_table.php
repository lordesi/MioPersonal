<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * "Sedute fisse" ("ogni martedì alle 18"): the rule the trainer sets for a
 * client they already follow. The sessions themselves are normal bookings,
 * made some weeks ahead and kept topped up by `bookings:extend-series`, so
 * reminders, packages, no-shows and the calendars work on them as always.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('booking_series', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trainer_profile_id')->constrained()->cascadeOnDelete();
            // The sessions already made stay on the bookings (booking_series_id goes null).
            $table->foreignId('client_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('service_id')->nullable()->constrained()->nullOnDelete();
            // The package the sessions are taken from; the series ends when it is used up.
            $table->foreignId('client_package_id')->nullable()->constrained()->nullOnDelete();

            // Copied when the series is made, as on a booking.
            $table->string('service_name', 100);
            $table->unsignedInteger('price_cents');
            $table->unsignedSmallInteger('minutes');
            $table->string('place_label', 255)->default('');

            // ISO: 1 = Monday … 7 = Sunday, and the start "HH:MM" in Rome time.
            $table->unsignedTinyInteger('weekday');
            $table->string('start_time', 5);
            $table->date('starts_on');
            $table->date('ends_on')->nullable();

            // active / ended
            $table->string('status', 10)->default('active');
            $table->timestamp('ended_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'trainer_profile_id']);
        });

        Schema::table('bookings', function (Blueprint $table) {
            $table->foreignId('booking_series_id')->nullable()->constrained('booking_series')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropConstrainedForeignId('booking_series_id');
        });

        Schema::dropIfExists('booking_series');
    }
};
