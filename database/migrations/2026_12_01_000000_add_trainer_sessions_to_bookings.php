<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * "Aggiungi seduta" from the trainer's calendar: a session with someone of
 * the trainer's list ("Clienti"), also without an account.
 * - `trainer_client_id`: the person in the list. Without an account the
 *   booking has no `client_id` until they sign up with the personal link.
 * - `requested_by`: who asked. 'trainer' and still pending: a proposal the
 *   client accepts or declines (not a request in "Richieste").
 * - `trainer_clients.invite_prompt_dismissed_at`: "Non chiedermelo più" on
 *   the "Invita Marco su Miopersonal" step after adding a session.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->foreignId('trainer_client_id')->nullable()->after('client_id')->constrained()->nullOnDelete();
            $table->string('requested_by', 10)->default('client')->after('status');
        });

        Schema::table('trainer_clients', function (Blueprint $table) {
            $table->timestamp('invite_prompt_dismissed_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('trainer_clients', function (Blueprint $table) {
            $table->dropColumn('invite_prompt_dismissed_at');
        });

        Schema::table('bookings', function (Blueprint $table) {
            $table->dropConstrainedForeignId('trainer_client_id');
            $table->dropColumn('requested_by');
        });
    }
};
