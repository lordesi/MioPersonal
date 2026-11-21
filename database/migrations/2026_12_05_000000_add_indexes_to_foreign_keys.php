<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * PostgreSQL doesn't index a foreign key by itself. Without one, a page
     * that filters by it (the bookings of a series, the photos of a gym…)
     * reads the whole table, and deleting a row (an account, a booking) makes
     * PostgreSQL read every table pointing to it. Only indexes: no data
     * changes. The columns are the foreign keys that had no index starting
     * with them (checked on the database, 21/11/2026).
     */
    private const COLUMNS = [
        'admin_activity_log' => ['admin_id'],
        'booking_events' => ['actor_id', 'booking_id'],
        'booking_series' => ['client_id', 'client_package_id', 'service_id', 'trainer_profile_id'],
        'bookings' => ['booking_series_id', 'client_package_id', 'service_id', 'trainer_client_id'],
        'calendar_events' => ['booking_id', 'group_session_id'],
        'client_achievements' => ['trainer_profile_id'],
        'client_packages' => ['service_id'],
        'client_preferences' => ['city_id'],
        'contact_messages' => ['user_id'],
        'cookie_consents' => ['user_id'],
        'group_session_hosts' => ['gym_profile_id', 'trainer_profile_id'],
        'group_sessions' => ['created_by_user_id', 'discipline_id', 'gym_profile_id'],
        'gym_courses' => ['discipline_id', 'instructor_trainer_id'],
        'gym_photos' => ['gym_profile_id'],
        'gym_plans' => ['gym_profile_id'],
        'gym_profile_reviews' => ['admin_id'],
        'gym_profiles' => ['city_id'],
        'gym_promotions' => ['gym_plan_id'],
        'messages' => ['sender_id'],
        'reports' => ['reporter_id', 'resolved_by'],
        'reviews' => ['client_id', 'hidden_by'],
        'search_logs' => ['city_id'],
        'services' => ['trainer_profile_id'],
        'trainer_clients' => ['user_id'],
        'trainer_documents' => ['trainer_profile_id'],
        'trainer_photos' => ['trainer_profile_id'],
        'trainer_places' => ['city_id', 'gym_profile_id'],
        'trainer_profile_reviews' => ['admin_id'],
        'trainer_profiles' => ['city_id'],
        'waitlist_entries' => ['group_session_id'],
    ];

    public function up(): void
    {
        foreach (self::COLUMNS as $name => $columns) {
            Schema::table($name, function (Blueprint $table) use ($columns) {
                foreach ($columns as $column) {
                    $table->index($column);
                }
            });
        }
    }

    public function down(): void
    {
        foreach (self::COLUMNS as $name => $columns) {
            Schema::table($name, function (Blueprint $table) use ($columns) {
                foreach ($columns as $column) {
                    $table->dropIndex([$column]);
                }
            });
        }
    }
};
