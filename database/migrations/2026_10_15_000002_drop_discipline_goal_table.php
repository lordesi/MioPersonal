<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The quiz is gone, and with it the goals each discipline served: nothing
 * else reads `discipline_goal`. The goal of "Completa il tuo profilo" stays
 * (it is a column of `client_preferences`).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('discipline_goal');
    }

    /** Back as it was, but empty: the goals were only a proposal of the team. */
    public function down(): void
    {
        Schema::create('discipline_goal', function (Blueprint $table) {
            $table->foreignId('discipline_id')->constrained()->cascadeOnDelete();
            $table->enum('goal', ['fitness', 'strength', 'posture', 'sport', 'wellbeing']);
            $table->primary(['discipline_id', 'goal']);
        });
    }
};
