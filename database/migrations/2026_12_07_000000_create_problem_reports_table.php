<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * "Segnala un problema": what a logged-in user saw going wrong, with the page,
 * the device and an optional screenshot, for "Admin · Problemi segnalati".
 * Deleted after ProblemReport::RETENTION_DAYS, or with the account.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('problem_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('role', 20);
            $table->text('message');
            $table->string('page', 300);
            $table->string('device', 100);
            $table->string('viewport', 20)->nullable();
            $table->boolean('installed')->default(false);
            $table->string('screenshot_path')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('user_id');
            $table->index('resolved_by');
            $table->index('resolved_at');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('problem_reports');
    }
};
