<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The proof of the choices made on the cookie banner (see CookieConsent).
 * Each choice is a new row, never changed: the history stays. No IP and
 * no user agent: they are not needed to prove the consent.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cookie_consents', function (Blueprint $table) {
            $table->id();
            // Also saved in the browser's cookie: links the choices of the same browser.
            $table->uuid('consent_id')->index();
            // Empty for guests, and once the user deletes the account.
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            // The cookie policy the user saw (CookieConsent::POLICY_VERSION).
            $table->string('policy_version', 20);
            $table->boolean('analytics');
            $table->boolean('marketing');
            $table->timestampTz('created_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cookie_consents');
    }
};
