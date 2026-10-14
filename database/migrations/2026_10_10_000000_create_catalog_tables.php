<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The lists the team manages: cities (provincial capitals, see
 * database/data/cities.csv) and disciplines with the goals they serve.
 * The rows come from CitySeeder and DisciplineSeeder.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cities', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            // In the search URL: /personal-trainer/{slug}
            $table->string('slug', 100)->unique();
            // Car plate code of the province, e.g. MI.
            $table->string('province_code', 2);
            $table->string('region', 50);
            // Centre of the city, for distances between cities.
            $table->decimal('lat', 9, 6);
            $table->decimal('lng', 9, 6);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('disciplines', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            // In the search URL: ?disciplina={slug}
            $table->string('slug', 100)->unique();
            $table->unsignedSmallInteger('sort')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Which quiz goals a discipline serves (see App\Enums\TrainingGoal).
        Schema::create('discipline_goal', function (Blueprint $table) {
            $table->foreignId('discipline_id')->constrained()->cascadeOnDelete();
            $table->enum('goal', ['fitness', 'strength', 'posture', 'sport', 'wellbeing']);
            $table->primary(['discipline_id', 'goal']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('discipline_goal');
        Schema::dropIfExists('disciplines');
        Schema::dropIfExists('cities');
    }
};
