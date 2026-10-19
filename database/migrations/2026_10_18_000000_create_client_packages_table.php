<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Step 5 of docs/database/analisi.md: the packages bought by the clients
 * (§3.4). The sessions used are counted from the bookings linked to the
 * package (`bookings.client_package_id`): no counter to keep in sync.
 * Packages don't expire (see drop_package_valid_days_from_services).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('client_packages', function (Blueprint $table) {
            $table->id();
            // Empty once the client deletes the account: the trainer keeps the past sessions.
            $table->foreignId('client_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('trainer_profile_id')->constrained()->cascadeOnDelete();
            // Empty once the trainer changes the services: the copies below stay.
            $table->foreignId('service_id')->nullable()->constrained()->nullOnDelete();

            // Copied when buying: later changes of the service don't touch it.
            $table->string('name', 100);
            $table->unsignedInteger('price_cents');
            $table->unsignedSmallInteger('sessions_total');
            // How long each session of the package lasts.
            $table->unsignedSmallInteger('minutes');

            // When the first session was confirmed: before that the package is not bought yet.
            $table->timestampTz('bought_at')->nullable();
            $table->timestampsTz();

            $table->index(['client_id', 'trainer_profile_id']);
            $table->index(['trainer_profile_id', 'bought_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_packages');
    }
};
