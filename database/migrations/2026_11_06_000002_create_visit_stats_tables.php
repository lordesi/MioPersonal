<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Visits to the site, without tracking cookies (App\Support\Stats::recordPageView):
 * daily counters only, and for unique visitors a code that changes every day
 * and can't be traced back to anyone (the salt of the day is thrown away).
 * Plus where each new user came from, for the acquisition channels.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Pages opened per day and area of the site (public, client, trainer).
        Schema::create('page_view_days', function (Blueprint $table) {
            $table->date('day');
            $table->string('section', 20);
            $table->unsignedInteger('views')->default(0);
            $table->primary(['day', 'section']);
        });

        // Visits (a new browsing session) per day and channel: "google", "instagram", "direct"…
        Schema::create('visit_days', function (Blueprint $table) {
            $table->date('day');
            $table->string('source', 60);
            $table->unsignedInteger('visits')->default(0);
            $table->primary(['day', 'source']);
        });

        // Unique visitors of the day: a hash with a salt kept only for that day.
        Schema::create('visitor_days', function (Blueprint $table) {
            $table->date('day');
            $table->char('visitor', 64);
            $table->primary(['day', 'visitor']);
        });

        // Where the user came from at sign-up: {source, medium, campaign, landing}.
        Schema::table('users', function (Blueprint $table) {
            $table->jsonb('acquisition')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('acquisition');
        });
        Schema::dropIfExists('visitor_days');
        Schema::dropIfExists('visit_days');
        Schema::dropIfExists('page_view_days');
    }
};
