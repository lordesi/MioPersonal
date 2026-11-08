<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * "Invita un amico": a session of a kind the trainer opened to more people
 * can be booked for 2…5. The slot stays the booker's: only who has the
 * invite link joins, as a guest of the booking.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('services', function (Blueprint $table) {
            // {"2": 7000, "3": 9000}: the total price for that many people. Null = only one.
            $table->jsonb('group_prices')->nullable()->after('price_cents');
        });

        Schema::table('bookings', function (Blueprint $table) {
            // How many people come, the booker included; price_cents is the total for them.
            $table->unsignedSmallInteger('people')->default(1)->after('price_cents');
            // The link the booker shares with friends; only when people > 1.
            $table->string('invite_token', 40)->nullable()->unique()->after('people');
        });

        Schema::create('booking_guests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            // App\Enums\BookingGuestStatus
            $table->enum('status', ['joined', 'left', 'removed'])->default('joined');
            $table->timestampsTz();

            $table->unique(['booking_id', 'user_id']);
            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_guests');

        Schema::table('bookings', function (Blueprint $table) {
            $table->dropUnique(['invite_token']);
            $table->dropColumn(['people', 'invite_token']);
        });

        Schema::table('services', function (Blueprint $table) {
            $table->dropColumn('group_prices');
        });
    }
};
