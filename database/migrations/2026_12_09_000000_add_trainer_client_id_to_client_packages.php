<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * "Aggiungi pacchetto" in the trainer's area: a package the trainer sold
 * outside the site, also to someone of the list without an account (as
 * `bookings.trainer_client_id`). The ones bought on the site keep only
 * `client_id`.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('client_packages', function (Blueprint $table) {
            $table->foreignId('trainer_client_id')->nullable()->after('client_id')->constrained('trainer_clients')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('client_packages', function (Blueprint $table) {
            $table->dropConstrainedForeignId('trainer_client_id');
        });
    }
};
