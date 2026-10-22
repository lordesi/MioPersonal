<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The new list of training goals of the design (see App\Enums\TrainingGoal),
 * for clients, trainers and the search:
 * - `client_preferences.goal` becomes plain text: the values are checked by
 *   the validation (Rule::enum), so a new goal won't need another migration;
 * - the saved goals of clients and trainers get the new names.
 * The rows are copied in PHP so it works on PostgreSQL and on the SQLite of the tests.
 */
return new class extends Migration
{
    /** Old value => new value. */
    private const NEW_NAMES = [
        'fitness' => 'weight_loss',
        'strength' => 'muscle',
        'posture' => 'posture',
        'sport' => 'athletic',
        'wellbeing' => 'wellbeing',
    ];

    public function up(): void
    {
        // The enum column of PostgreSQL is a text with this CHECK on the old values.
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE client_preferences DROP CONSTRAINT IF EXISTS client_preferences_goal_check');
        }

        Schema::table('client_preferences', function (Blueprint $table) {
            $table->string('goal', 20)->nullable()->change();
        });

        $this->rename(self::NEW_NAMES);
    }

    public function down(): void
    {
        // "Corsa e endurance" didn't exist: the closest old goal.
        $this->rename([...array_flip(self::NEW_NAMES), 'endurance' => 'sport']);

        // SQLite (tests) can't add constraints to an existing table.
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE client_preferences ADD CONSTRAINT client_preferences_goal_check CHECK (goal IN ('fitness', 'strength', 'posture', 'sport', 'wellbeing'))");
        }
    }

    /**
     * Renames the goals of the clients and of the trainers.
     *
     * @param  array<string, string>  $names  old value => new value
     */
    private function rename(array $names): void
    {
        foreach ($names as $old => $new) {
            DB::table('client_preferences')->where('goal', $old)->update(['goal' => $new]);
        }

        DB::table('trainer_profiles')->whereNotNull('goals')->select(['id', 'goals'])->orderBy('id')->each(function (object $profile) use ($names) {
            /** @var list<string> $goals */
            $goals = json_decode($profile->goals, true);

            DB::table('trainer_profiles')->where('id', $profile->id)->update([
                'goals' => json_encode(array_values(array_unique(array_map(fn (string $goal) => $names[$goal] ?? $goal, $goals)))),
            ]);
        });
    }
};
