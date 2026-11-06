<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The history behind the numbers of the team (App\Support\Stats): what the
 * other tables can't tell afterwards. Users, bookings and reviews already keep
 * their dates; these keep who was active on which day, what people search,
 * and how many times each profile is opened.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Active users per day, week, month; retention and churn. Deleted with the account.
        Schema::create('user_activity_days', function (Blueprint $table) {
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // The Rome date.
            $table->date('day');
            // The role on that day: a client can become a trainer later.
            $table->string('role', 20);
            $table->primary(['user_id', 'day']);
            $table->index('day');
        });

        // Anonymous: no user, only the role ("guest" for visitors).
        Schema::create('search_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('city_id')->nullable()->constrained()->restrictOnDelete();
            // Slugs and App\Enums\TrainingGoal values.
            $table->jsonb('disciplines');
            $table->jsonb('goals');
            // The names of the other filters in use, e.g. ["prezzo", "modalita"].
            $table->jsonb('filters');
            $table->unsignedInteger('results');
            $table->string('role', 20);
            $table->timestampTz('created_at')->index();
        });

        Schema::create('trainer_profile_views', function (Blueprint $table) {
            $table->foreignId('trainer_profile_id')->constrained()->cascadeOnDelete();
            $table->date('day');
            $table->unsignedInteger('views')->default(0);
            $table->primary(['trainer_profile_id', 'day']);
            $table->index('day');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trainer_profile_views');
        Schema::dropIfExists('search_logs');
        Schema::dropIfExists('user_activity_days');
    }
};
