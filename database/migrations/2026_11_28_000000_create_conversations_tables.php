<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * "Messaggi": one conversation per trainer and registered client
 * (trainer_clients), with text and PDF attachments ("schede").
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('conversations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trainer_client_id')->unique()->constrained()->cascadeOnDelete();
            // The list is sorted by it.
            $table->timestamp('last_message_at')->nullable();
            // Only to show the conversations with new messages in bold.
            $table->timestamp('trainer_read_at')->nullable();
            $table->timestamp('client_read_at')->nullable();
            $table->timestamps();
        });

        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sender_id')->constrained('users')->cascadeOnDelete();
            $table->text('body')->nullable();
            // A PDF on the private disk, downloaded only by the two people.
            $table->string('attachment_path')->nullable();
            $table->string('attachment_name')->nullable();
            $table->unsignedInteger('attachment_size')->nullable();
            $table->timestamp('created_at')->nullable();

            $table->index(['conversation_id', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('messages');
        Schema::dropIfExists('conversations');
    }
};
