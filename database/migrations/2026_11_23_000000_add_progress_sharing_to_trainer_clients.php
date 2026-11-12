<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Between a client with an account and one of their trainers.
 * `progress_shared_at`: the client shares "Panoramica" (trainings, weeks in a
 * row, the weight only with the consent) with this trainer; off by default,
 * withdrawn any time. `shared_note`: the trainer's note for the client, shown
 * on top of "Panoramica"; unlike `private_notes`, the client reads it.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('trainer_clients', function (Blueprint $table) {
            $table->timestamp('progress_shared_at')->nullable();
            $table->string('shared_note', 500)->nullable();
            $table->timestamp('shared_note_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('trainer_clients', function (Blueprint $table) {
            $table->dropColumn(['progress_shared_at', 'shared_note', 'shared_note_at']);
        });
    }
};
