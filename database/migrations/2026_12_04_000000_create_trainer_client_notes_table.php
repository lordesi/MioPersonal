<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * "Note" in the card of a client: the trainer's own dated notes, never
     * shown to the client. The old single `trainer_clients.private_notes`
     * stays, shown as the first undated note while it has text.
     */
    public function up(): void
    {
        Schema::create('trainer_client_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trainer_client_id')->constrained()->cascadeOnDelete();
            $table->text('body');
            $table->timestamps();

            $table->index(['trainer_client_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trainer_client_notes');
    }
};
