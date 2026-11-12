<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The client's "Panoramica". `activity_logs`: "Segna un allenamento", a light
 * diary (what, when, how long, how hard), no exercises or loads; the booked
 * sessions are not copied here, App\Support\ClientProgress reads them too.
 * `body_measurements`: the weight over time, health data (GDPR art. 9), only
 * with `client_preferences.body_data_consent_at`; withdrawing it deletes them.
 * Both go with the account.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // Rome day.
            $table->date('done_on');
            $table->string('kind', 20);
            $table->unsignedSmallInteger('minutes')->nullable();
            // 1 leggero, 2 giusto, 3 intenso.
            $table->unsignedTinyInteger('effort')->nullable();
            $table->string('note', 280)->nullable();
            $table->timestamps();

            $table->index(['user_id', 'done_on']);
        });

        Schema::create('body_measurements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // Rome day: one weight a day, the last one saved wins.
            $table->date('measured_on');
            $table->unsignedInteger('weight_grams');
            $table->timestamps();

            $table->unique(['user_id', 'measured_on']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('body_measurements');
        Schema::dropIfExists('activity_logs');
    }
};
