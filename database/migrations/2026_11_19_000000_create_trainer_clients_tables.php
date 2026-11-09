<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The trainer's own list of clients ("Clienti"): people who booked on the
 * site, and people the trainer added by hand and invited with a personal
 * link. Private notes, the goal and the payments the trainer wrote down
 * (a register only: no money goes through the site) live here.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trainer_clients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trainer_profile_id')->constrained()->cascadeOnDelete();
            // Empty until the person signs up (or after they delete the account): the trainer keeps their notes.
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name', 100);
            // Only for who has no account: with one, the account's contacts are used.
            $table->string('email', 255)->nullable();
            $table->string('phone', 40)->nullable();
            $table->string('goal', 200)->nullable();
            $table->text('private_notes')->nullable();
            // The personal invite link: whoever signs up from it is this record.
            $table->string('invite_token', 40)->unique();
            $table->timestamps();

            $table->unique(['trainer_profile_id', 'user_id']);
        });

        Schema::create('client_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trainer_client_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('amount_cents');
            $table->date('paid_on');
            $table->string('note', 200)->nullable();
            $table->timestamps();

            $table->index(['trainer_client_id', 'paid_on']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_payments');
        Schema::dropIfExists('trainer_clients');
    }
};
