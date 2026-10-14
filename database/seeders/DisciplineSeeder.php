<?php

namespace Database\Seeders;

use App\Models\Discipline;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * The single list of disciplines (it replaces the 5 lists that were written
 * in the code). Safe to run again: existing disciplines are updated, none is
 * duplicated.
 */
class DisciplineSeeder extends Seeder
{
    /** In the order of the trainer registration. */
    private const DISCIPLINES = [
        'Functional',
        'Pesi e bodybuilding',
        'Pilates',
        'Yoga',
        'Crossfit',
        'Preparazione atletica',
        'Boxe',
        'Calisthenics',
        'Postura',
        'Running',
    ];

    public function run(): void
    {
        DB::transaction(function () {
            $sort = 0;

            foreach (self::DISCIPLINES as $name) {
                Discipline::updateOrCreate(
                    ['slug' => Str::slug($name)],
                    ['name' => $name, 'sort' => $sort += 10],
                );
            }
        });
    }
}
