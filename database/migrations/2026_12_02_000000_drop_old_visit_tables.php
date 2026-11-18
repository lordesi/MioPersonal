<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The old in-house visit counter: since PR #5 (18/11/2026) the visits come
 * from Cloudflare Web Analytics (App\Support\CloudflareAnalytics) and the code
 * no longer uses these tables. Their numbers were inflated by bots.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('visitor_days');
        Schema::dropIfExists('visit_days');
    }

    /** Empty again, as they were created. */
    public function down(): void
    {
        Schema::create('visit_days', function (Blueprint $table) {
            $table->date('day');
            $table->string('source', 60);
            $table->unsignedInteger('visits')->default(0);
            $table->primary(['day', 'source']);
        });

        Schema::create('visitor_days', function (Blueprint $table) {
            $table->date('day');
            $table->char('visitor', 64);
            $table->primary(['day', 'visitor']);
        });
    }
};
