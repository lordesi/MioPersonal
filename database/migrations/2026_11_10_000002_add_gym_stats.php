<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The numbers of the gyms (App\Support\Stats): which search was made
 * (trainers or gyms) and how many times each gym profile is opened.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('search_logs', function (Blueprint $table) {
            // 'trainer' or 'gym'.
            $table->string('kind', 10)->default('trainer');
        });

        Schema::create('gym_profile_views', function (Blueprint $table) {
            $table->foreignId('gym_profile_id')->constrained()->cascadeOnDelete();
            $table->date('day');
            $table->unsignedInteger('views')->default(0);
            $table->primary(['gym_profile_id', 'day']);
            $table->index('day');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gym_profile_views');

        Schema::table('search_logs', function (Blueprint $table) {
            $table->dropColumn('kind');
        });
    }
};
