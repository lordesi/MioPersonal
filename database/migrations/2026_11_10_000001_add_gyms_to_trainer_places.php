<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * A trainer who works in a gym of MioPersonal: once the link is accepted
 * (gym_trainer) the trainer gets a place of type "gym" pointing to it, so the
 * profile, the search by city and the booking read it like any other place.
 * Name and address are read from the gym, never copied. Studios typed by hand
 * stay as they are ("Studio privato").
 */
return new class extends Migration
{
    private const OLD_TYPES = ['studio', 'home', 'park', 'online'];

    private const NEW_TYPES = [...self::OLD_TYPES, 'gym'];

    public function up(): void
    {
        $this->placeTypes(self::NEW_TYPES);

        Schema::table('trainer_places', function (Blueprint $table) {
            $table->foreignId('gym_profile_id')->nullable()->constrained()->cascadeOnDelete();
            $table->unique(['trainer_profile_id', 'gym_profile_id']);
        });
    }

    public function down(): void
    {
        Schema::table('trainer_places', function (Blueprint $table) {
            $table->dropUnique(['trainer_profile_id', 'gym_profile_id']);
            $table->dropConstrainedForeignId('gym_profile_id');
        });

        DB::table('trainer_places')->where('type', 'gym')->delete();
        $this->placeTypes(self::OLD_TYPES);
    }

    /**
     * The CHECK of the enum: rewritten on PostgreSQL, the table rebuilt on SQLite (tests).
     *
     * @param  list<string>  $types
     */
    private function placeTypes(array $types): void
    {
        if (DB::getDriverName() === 'pgsql') {
            $list = implode(', ', array_map(fn (string $type) => "'{$type}'", $types));
            DB::statement('ALTER TABLE trainer_places DROP CONSTRAINT IF EXISTS trainer_places_type_check');
            DB::statement("ALTER TABLE trainer_places ADD CONSTRAINT trainer_places_type_check CHECK (type::text IN ({$list}))");

            return;
        }

        Schema::table('trainer_places', function (Blueprint $table) use ($types) {
            $table->enum('type', $types)->change();
        });
    }
};
