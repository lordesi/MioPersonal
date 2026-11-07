<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The social accounts a trainer linked with OAuth ("Collega Instagram"), shown
 * as icons on the public profile. No token is kept: only who the account is.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trainer_social_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trainer_profile_id')->constrained()->cascadeOnDelete();
            // App\Enums\SocialProvider
            $table->string('provider', 20);
            $table->string('provider_user_id', 100);
            $table->string('handle', 100);
            $table->string('url', 255);
            $table->timestamp('connected_at');
            $table->timestamps();

            // One account of a social for one trainer only, and one per social.
            $table->unique(['provider', 'provider_user_id']);
            $table->unique(['trainer_profile_id', 'provider']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trainer_social_accounts');
    }
};
