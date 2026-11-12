<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * "Segnala": trainer profiles, gym profiles and reviews reported by users,
 * for "Admin · Segnalazioni". `resolution`: "removed" (the team hid the
 * content) or "dismissed" (nothing wrong).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reporter_id')->nullable()->constrained('users')->nullOnDelete();
            $table->morphs('reportable');
            $table->string('reason', 20);
            $table->string('details', 500)->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('resolution', 20)->nullable();
            $table->timestamps();

            $table->index('resolved_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};
