<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('trainer_clients', function (Blueprint $table) {
            // "Ancora da contattare" in "Clienti": taken out of the list with the X, on every device.
            $table->timestamp('contact_hidden_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('trainer_clients', function (Blueprint $table) {
            $table->dropColumn('contact_hidden_at');
        });
    }
};
