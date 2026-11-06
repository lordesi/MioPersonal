<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Step 8 of docs/database/analisi.md: the gyms. A gym is an account of its
 * own (users.role = 'gym') with a public profile the team approves, like the
 * trainers: photos, hours, services, plans and promotions (shown only, paid
 * outside the platform), and the trainers who work there (gym_trainer, both
 * sides must agree). Deleting a profile deletes all its rows.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gym_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            // In the URL: /palestra/{slug}
            $table->string('slug', 120)->unique();
            $table->string('name', 120);
            $table->text('description');
            // A city is hidden, never deleted.
            $table->foreignId('city_id')->constrained()->restrictOnDelete();
            $table->string('address', 200);
            $table->string('postal_code', 10)->nullable();
            // App\Enums\GymAmenity values: "Servizi" of the profile and of the search.
            $table->jsonb('amenities');
            // Under the hours: "Chiusa ad agosto", "Festivi 9–13".
            $table->string('opening_notes', 200)->nullable();

            // Public contacts.
            $table->string('phone', 30)->nullable();
            $table->string('email', 150)->nullable();
            $table->string('website', 200)->nullable();
            $table->string('instagram', 30)->nullable();

            // Approval by the team: same values as App\Enums\TrainerProfileStatus.
            $table->enum('status', ['review', 'changes', 'approved', 'rejected'])->default('review');
            $table->timestampTz('status_changed_at')->nullable();
            $table->timestampTz('approved_at')->nullable();
            $table->boolean('visible_in_search')->default(true);

            // Computed from the plans: the cheapest monthly price, for search and cards.
            $table->unsignedInteger('monthly_from_cents')->nullable();

            $table->timestampsTz();

            $table->index(['status', 'visible_in_search', 'city_id']);
        });

        // Cover (is_cover) and gallery, on the public disk.
        Schema::create('gym_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gym_profile_id')->constrained()->cascadeOnDelete();
            $table->string('path');
            $table->boolean('is_cover')->default(false);
            $table->unsignedSmallInteger('sort')->default(0);
            $table->timestampsTz();
        });

        // Weekly opening hours in Rome time; more ranges a day, no row = closed.
        Schema::create('gym_opening_hours', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gym_profile_id')->constrained()->cascadeOnDelete();
            // 1 = Monday … 7 = Sunday (ISO).
            $table->unsignedTinyInteger('weekday');
            $table->time('opens_at');
            $table->time('closes_at');
            $table->index(['gym_profile_id', 'weekday']);
        });

        // "Abbonamenti": shown on the profile, bought at the gym. Prices in whole cents.
        Schema::create('gym_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gym_profile_id')->constrained()->cascadeOnDelete();
            $table->string('name', 100);
            // See App\Enums\GymPlanPeriod; "entries" = a pack of entries.
            $table->enum('period', ['monthly', 'quarterly', 'yearly', 'entries']);
            $table->unsignedSmallInteger('entries_count')->nullable();
            $table->unsignedInteger('price_cents');
            // "Cosa include": short lines.
            $table->jsonb('features')->nullable();
            $table->string('note', 200)->nullable();
            $table->unsignedSmallInteger('sort')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestampsTz();
        });

        // "Promozioni": public only between the two dates (Rome days, both included).
        Schema::create('gym_promotions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gym_profile_id')->constrained()->cascadeOnDelete();
            // The plan on offer, if any: the promotion stays if the plan goes.
            $table->foreignId('gym_plan_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title', 100);
            $table->string('description', 500)->nullable();
            // One of the two: the promotional price or the discount.
            $table->unsignedInteger('promo_price_cents')->nullable();
            $table->unsignedTinyInteger('discount_percent')->nullable();
            $table->date('starts_on')->nullable();
            $table->date('ends_on')->nullable();
            $table->timestampsTz();
            $table->index(['gym_profile_id', 'ends_on']);
        });

        // History of the team's decisions in "Admin · Verifica · Palestre".
        Schema::create('gym_profile_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gym_profile_id')->constrained()->cascadeOnDelete();
            $table->foreignId('admin_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('decision', ['approved', 'changes', 'rejected', 'undone']);
            $table->jsonb('reasons')->nullable();
            $table->text('message_to_gym')->nullable();
            $table->text('internal_note')->nullable();
            $table->timestampTz('created_at')->nullable();
            $table->index(['gym_profile_id', 'created_at']);
        });

        // The trainers of a gym: one side asks, the other accepts. Removing deletes the row.
        Schema::create('gym_trainer', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gym_profile_id')->constrained()->cascadeOnDelete();
            $table->foreignId('trainer_profile_id')->constrained()->cascadeOnDelete();
            // See App\Enums\GymLinkStatus and App\Enums\GymLinkSide.
            $table->enum('status', ['pending', 'accepted', 'declined'])->default('pending');
            $table->enum('initiated_by', ['gym', 'trainer']);
            $table->string('message', 300)->nullable();
            $table->timestampTz('responded_at')->nullable();
            $table->timestampsTz();
            $table->unique(['gym_profile_id', 'trainer_profile_id']);
            $table->index(['trainer_profile_id', 'status']);
        });

        // SQLite (tests) can't add constraints to an existing table.
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE gym_opening_hours ADD CONSTRAINT gym_opening_hours_weekday_check CHECK (weekday BETWEEN 1 AND 7)');
            DB::statement('ALTER TABLE gym_opening_hours ADD CONSTRAINT gym_opening_hours_range_check CHECK (opens_at < closes_at)');
            DB::statement("ALTER TABLE gym_plans ADD CONSTRAINT gym_plans_entries_check CHECK ((period = 'entries') = (entries_count IS NOT NULL))");
            DB::statement('ALTER TABLE gym_promotions ADD CONSTRAINT gym_promotions_price_check CHECK ((promo_price_cents IS NULL) <> (discount_percent IS NULL))');
            DB::statement('ALTER TABLE gym_promotions ADD CONSTRAINT gym_promotions_percent_check CHECK (discount_percent IS NULL OR discount_percent BETWEEN 1 AND 90)');
            DB::statement('CREATE INDEX gym_profiles_amenities_index ON gym_profiles USING GIN (amenities)');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('gym_trainer');
        Schema::dropIfExists('gym_profile_reviews');
        Schema::dropIfExists('gym_promotions');
        Schema::dropIfExists('gym_plans');
        Schema::dropIfExists('gym_opening_hours');
        Schema::dropIfExists('gym_photos');
        Schema::dropIfExists('gym_profiles');
    }
};
