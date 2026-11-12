<?php

namespace Tests\Feature;

use App\Enums\CourseLevel;
use App\Enums\GymLinkSide;
use App\Enums\GymLinkStatus;
use App\Models\City;
use App\Models\Discipline;
use App\Models\GymCourse;
use App\Models\GymProfile;
use App\Models\TrainerProfile;
use App\Support\CourseCard;
use Carbon\CarbonImmutable;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** "Corsi a {città}": /corsi, the courses of the gyms in the search. */
class CourseSearchTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(CatalogSeeder::class);
    }

    /**
     * A course with its weekly lessons: [weekday, "HH:MM", capacity].
     *
     * @param  list<array{0: int, 1: string, 2?: int|null}>  $lessons
     * @param  array<string, mixed>  $attributes
     */
    private function course(GymProfile $gym, string $name, array $lessons, array $attributes = []): GymCourse
    {
        $course = $gym->courses()->create([
            'name' => $name,
            'level' => CourseLevel::All,
            'is_active' => true,
            'bookable' => false,
            ...$attributes,
        ]);

        foreach ($lessons as $lesson) {
            $end = sprintf('%02d:%s', (int) substr($lesson[1], 0, 2) + 1, substr($lesson[1], 3, 2));
            $course->lessons()->create([
                'weekday' => $lesson[0],
                'starts_at' => $lesson[1].':00',
                'ends_at' => $end.':00',
                'capacity' => $lesson[2] ?? null,
            ]);
        }

        return $course;
    }

    public function test_it_lists_the_active_courses_of_published_gyms(): void
    {
        $gym = GymProfile::factory()->approved()->create();
        $this->course($gym, 'Pilates', [[1, '18:30']]);
        $this->course($gym, 'Spento', [[1, '18:30']], ['is_active' => false]);
        $this->course($gym, 'Senza lezioni', []);
        $this->course(GymProfile::factory()->create(), 'Palestra in revisione', [[1, '18:30']]);

        $this->get(route('courses.search'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('public/course-search')
                ->where('total', 1)
                ->where('courses.0.name', 'Pilates')
                ->where('courses.0.when', 'Lun 18:30')
                ->where('courses.0.href', route('gyms.show', [$gym->slug, 'corso' => $gym->courses()->first()->id], false).'#corsi')
                ->where('courses.0.gym.name', $gym->name));
    }

    public function test_day_and_time_look_at_the_same_lesson(): void
    {
        $gym = GymProfile::factory()->approved()->create();
        // Monday morning and Wednesday evening: not "Monday evening".
        $this->course($gym, 'Yoga', [[1, '09:00'], [3, '19:00']]);
        $this->course($gym, 'Spinning', [[1, '19:00']]);

        $this->get(route('courses.search', ['giorno' => 'lun', 'fascia' => 'sera']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('total', 1)
                ->where('courses.0.name', 'Spinning')
                ->where('filters.giorno', 'lun')
                ->where('filters.fascia', 'sera'));
    }

    public function test_city_discipline_level_and_online_filters(): void
    {
        $milano = City::query()->where('slug', 'milano')->firstOrFail();
        $discipline = Discipline::query()->active()->firstOrFail();
        $here = GymProfile::factory()->approved()->inCity($milano)->create();
        $elsewhere = GymProfile::factory()->approved()->create();

        $this->course($here, 'Prenotabile', [[2, '18:00', 12]], [
            'bookable' => true,
            'discipline_id' => $discipline->id,
            'level' => CourseLevel::Beginner,
        ]);
        $this->course($here, 'In palestra', [[2, '18:00']]);
        $this->course($elsewhere, 'Altrove', [[2, '18:00', 12]], ['bookable' => true]);

        $this->get(route('courses.search', 'milano'))
            ->assertInertia(fn (Assert $page) => $page->where('total', 2)->where('city.slug', 'milano'));

        $this->get(route('courses.search', ['milano', 'online' => '1']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('total', 1)
                ->where('courses.0.name', 'Prenotabile')
                ->where('courses.0.bookable', true));

        $this->get(route('courses.search', ['disciplina' => $discipline->slug, 'livello' => 'beginner']))
            ->assertInertia(fn (Assert $page) => $page->where('total', 1)->where('courses.0.name', 'Prenotabile'));
    }

    public function test_unknown_filters_are_dropped_and_empty_results_suggest_the_others(): void
    {
        $gym = GymProfile::factory()->approved()->create();
        $this->course($gym, 'Pilates', [[1, '18:30']]);

        $this->get(route('courses.search', ['giorno' => 'domani', 'livello' => 'pro']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('filters.giorno', null)
                ->where('filters.livello', null)
                ->where('total', 1));

        $this->get(route('courses.search', ['giorno' => 'dom']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('total', 0)
                ->has('suggestions', 1));
    }

    public function test_an_unknown_city_is_not_found(): void
    {
        $this->get('/corsi/atlantide')->assertNotFound();
    }

    public function test_the_trainer_profile_shows_the_courses_they_teach(): void
    {
        $trainer = TrainerProfile::factory()->approved()->create();
        $gym = GymProfile::factory()->approved()->create();
        $this->course($gym, 'Functional', [[5, '07:00']], ['instructor_trainer_id' => $trainer->id]);

        $this->get(route('trainers.show', $trainer->slug))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('courses', 1)
                ->where('courses.0.name', 'Functional')
                ->where('courses.0.gym.name', $gym->name));
    }

    public function test_the_trainer_area_shows_the_courses_taught_at_each_gym(): void
    {
        $trainer = TrainerProfile::factory()->approved()->create();
        $gym = GymProfile::factory()->approved()->create();
        $gym->links()->forceCreate([
            'trainer_profile_id' => $trainer->id,
            'status' => GymLinkStatus::Accepted,
            'initiated_by' => GymLinkSide::Trainer,
        ]);
        $course = $this->course($gym, 'Functional', [[5, '07:00']], ['instructor_trainer_id' => $trainer->id]);
        $this->course($gym, 'Altro istruttore', [[5, '08:00']]);

        $this->actingAs($trainer->user)
            ->get(route('trainer.gyms'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('gyms.0.courses', 1)
                ->where('gyms.0.courses.0.name', 'Functional')
                ->where('gyms.0.courses.0.when', 'Ven 07:00')
                ->where('gyms.0.courses.0.href', CourseCard::href($course)));
    }

    public function test_the_gym_dashboard_shows_the_lessons_of_today(): void
    {
        $this->travelTo(CarbonImmutable::parse('2026-11-11 09:00', 'Europe/Rome')); // a Wednesday
        $gym = GymProfile::factory()->approved()->create();
        $this->course($gym, 'Pilates', [[3, '18:30'], [4, '18:30']]);

        $this->actingAs($gym->user)
            ->get(route('gym.dashboard'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('todayLessons', 1)
                ->where('todayLessons.0.name', 'Pilates')
                ->where('todayLessons.0.start', '18:30'));
    }

    public function test_the_home_shows_courses_and_events(): void
    {
        $this->course(GymProfile::factory()->approved()->create(), 'Pilates', [[1, '18:30']]);

        $this->get(route('home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('featuredCourses', 1)
                ->has('events')
                ->has('eventTypes'));
    }
}
