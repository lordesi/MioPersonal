<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The trainer cancels a session (with a message for the client) or proposes
 * another time ("Sposta"): the session moves only if the client accepts.
 * The history gets "proposed" and "rescheduled".
 */
return new class extends Migration
{
    private const OLD_TYPES = ['requested', 'confirmed', 'declined', 'cancelled', 'expired'];

    private const NEW_TYPES = [...self::OLD_TYPES, 'proposed', 'rescheduled'];

    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->string('cancel_note', 300)->nullable();
            // The new start the trainer proposes; the old one holds until the client accepts.
            $table->timestamp('proposed_starts_at')->nullable();
            $table->timestamp('proposal_expires_at')->nullable()->index();
        });

        $this->eventTypes(self::NEW_TYPES);
    }

    public function down(): void
    {
        DB::table('booking_events')->whereIn('type', ['proposed', 'rescheduled'])->delete();
        $this->eventTypes(self::OLD_TYPES);

        Schema::table('bookings', function (Blueprint $table) {
            $table->dropIndex(['proposal_expires_at']);
            $table->dropColumn(['cancel_note', 'proposed_starts_at', 'proposal_expires_at']);
        });
    }

    /**
     * The CHECK of the enum: rewritten on PostgreSQL, the table rebuilt on SQLite (tests).
     *
     * @param  list<string>  $types
     */
    private function eventTypes(array $types): void
    {
        if (DB::getDriverName() === 'pgsql') {
            $list = implode(', ', array_map(fn (string $type) => "'{$type}'", $types));
            DB::statement('ALTER TABLE booking_events DROP CONSTRAINT IF EXISTS booking_events_type_check');
            DB::statement("ALTER TABLE booking_events ADD CONSTRAINT booking_events_type_check CHECK (type::text IN ({$list}))");

            return;
        }

        Schema::table('booking_events', function (Blueprint $table) use ($types) {
            $table->enum('type', $types)->change();
        });
    }
};
