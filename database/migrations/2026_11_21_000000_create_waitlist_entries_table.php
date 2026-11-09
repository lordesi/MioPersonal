<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * "Avvisami se si libera": a client waiting for a place in a full event, or
 * for a free slot on a day a trainer is full. Exactly one of the two. When
 * something frees up the first ones in line are told (`notified_at`) and keep
 * their turn for a few hours; they are never booked automatically.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('waitlist_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('group_session_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('trainer_profile_id')->nullable()->constrained()->cascadeOnDelete();
            // Rome day, for the trainer's days.
            $table->date('day')->nullable();
            $table->timestamp('notified_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'group_session_id']);
            $table->unique(['user_id', 'trainer_profile_id', 'day']);
            $table->index(['trainer_profile_id', 'day']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('waitlist_entries');
    }
};
