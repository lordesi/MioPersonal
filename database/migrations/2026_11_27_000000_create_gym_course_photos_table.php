<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The courses are no longer booked on MioPersonal (only the gym's members
 * take them): "Prenotazione posto" goes away, the places of a lesson stay as
 * "Max N posti". A course gets more photos instead of one: the old photo
 * becomes the first.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gym_course_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gym_course_id')->constrained()->cascadeOnDelete();
            $table->string('path');
            // Signed: "Metti per prima" goes below the lowest.
            $table->integer('sort')->default(0);
            $table->timestamps();

            $table->index(['gym_course_id', 'sort']);
        });

        $now = now();

        DB::table('gym_courses')->whereNotNull('photo_path')->orderBy('id')->each(function (object $course) use ($now) {
            DB::table('gym_course_photos')->insert([
                'gym_course_id' => $course->id,
                'path' => $course->photo_path,
                'sort' => 10,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        });

        Schema::table('gym_courses', function (Blueprint $table) {
            $table->dropColumn(['photo_path', 'bookable']);
        });
    }

    public function down(): void
    {
        Schema::table('gym_courses', function (Blueprint $table) {
            $table->string('photo_path')->nullable();
            $table->boolean('bookable')->default(false);
        });

        DB::table('gym_course_photos')->orderBy('sort')->orderBy('id')->get()
            ->unique('gym_course_id')
            ->each(fn (object $photo) => DB::table('gym_courses')->where('id', $photo->gym_course_id)->update(['photo_path' => $photo->path]));

        Schema::dropIfExists('gym_course_photos');
    }
};
