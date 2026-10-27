<?php

namespace Tests\Feature;

use App\Enums\PlaceType;
use App\Enums\TrainerProfileStatus;
use App\Enums\TrainerReviewDecision;
use App\Enums\UserRole;
use App\Models\TrainerProfile;
use App\Models\User;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** "Diventa trainer": the whole registration (steps 2–7) is saved. */
class TrainerRegistrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(CatalogSeeder::class);
        Storage::fake('public');
        Storage::fake('local');
    }

    /**
     * A kind of session of "Servizi e prezzi" as the page sends it.
     *
     * @param  array<string, mixed>  $changes
     * @return array<string, mixed>
     */
    private function sessionType(array $changes = []): array
    {
        return [
            'name' => 'Seduta singola',
            'prices' => [['minutes' => '60', 'price_cents' => '4500'], ['minutes' => '90', 'price_cents' => '6000']],
            'note' => 'in studio o a domicilio',
            ...$changes,
        ];
    }

    /**
     * Steps 2–7 as the page sends them (toPayload in draft.ts).
     *
     * @param  array<string, mixed>  $changes
     * @return array<string, mixed>
     */
    private function profile(array $changes = []): array
    {
        return [
            'headline' => 'Functional training e Pilates',
            'bio' => str_repeat('Alleno persone che vogliono tornare in forma. ', 5),
            'experience' => '5to10',
            // Required for a new profile.
            'photo' => UploadedFile::fake()->image('ritratto.jpg', 600, 600),
            'disciplines' => ['pilates', 'functional'],
            'goals' => ['posture', 'weight_loss'],
            'places' => ['studio', 'home', 'online'],
            'studios' => [['name' => 'Studio Città Studi', 'address' => 'Via Pascoli 10']],
            'city' => 'milano',
            'other_cities' => ['monza'],
            // "Servizi e prezzi": a kind of session of 1 hour and 1 hour and a half,
            // each with its price, and a first session.
            'sessions' => [$this->sessionType()],
            'first_session' => ['minutes' => '60', 'price_cents' => '3000', 'note' => ''],
            'packages' => [],
            // Monday 7–12 and 18–21, Saturday 9–11.
            'hours' => [0 => [7, 8, 9, 10, 11, 18, 19, 20], 5 => [9, 10]],
            // As text, like the page sends them with files (FormData).
            'notice_hours' => '12',
            'booking_window_days' => '60',
            'break_minutes' => '15',
            'max_sessions_per_day' => '6',
            'free_cancellation_hours' => '24',
            'auto_confirm' => '0',
            'certifications' => [
                ['title' => 'Laurea in Scienze Motorie', 'issuer' => 'Università di Milano', 'year' => '2016', 'file' => UploadedFile::fake()->create('laurea.pdf', 200, 'application/pdf')],
            ],
            ...$changes,
        ];
    }

    public function test_a_guest_creates_the_account_and_the_whole_profile()
    {
        $this->post(route('trainer.register.store'), [
            'first_name' => 'Giulia',
            'last_name' => 'Rossi',
            'email' => 'giulia@example.com',
            'phone' => '347 521 8846',
            'password' => 'Password1',
            'terms' => '1',
            ...$this->profile(['photo' => UploadedFile::fake()->image('giulia.jpg', 600, 600)]),
        ])
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('trainer.register', absolute: false));

        $this->assertAuthenticated();
        $user = User::where('email', 'giulia@example.com')->firstOrFail();
        $this->assertSame(UserRole::Trainer, $user->role);
        $this->assertSame('+393475218846', $user->phone);

        $profile = $user->trainerProfile;
        $this->assertNotNull($profile);
        $this->assertSame('giulia-rossi', $profile->slug);
        $this->assertSame(TrainerProfileStatus::Review, $profile->status);
        $this->assertSame('milano', $profile->city?->slug);
        $this->assertSame(['pilates', 'functional'], $profile->disciplines->pluck('slug')->all());
        $this->assertSame(['posture', 'weight_loss'], $profile->goals);
        $this->assertSame(['monza'], $profile->otherCities->pluck('slug')->all());
        $this->assertSame([PlaceType::Studio, PlaceType::Home, PlaceType::Online], $profile->places->pluck('type')->all());
        $this->assertSame('Via Pascoli 10', $profile->places->first()?->address);
        $this->assertTrue($profile->trains_online);
        $this->assertTrue($profile->trains_in_person);
        // "da 45 €": the lowest price of a session, not the one-off first session.
        $this->assertSame(4500, $profile->price_from_cents);
        // The durations of the prices (and of the first session).
        $this->assertSame([60, 90], $profile->session_minutes);
        $this->assertSame(6, $profile->max_sessions_per_day);

        // Consecutive hours become one range; 0 = Monday → weekday 1.
        $this->assertSame(
            [[1, '07:00', '12:00'], [1, '18:00', '21:00'], [6, '09:00', '11:00']],
            $profile->workingHours->map(fn ($range) => [$range->weekday, substr($range->starts_at, 0, 5), substr($range->ends_at, 0, 5)])->all(),
        );
        $this->assertNotNull($profile->next_free_slot_at);

        $photo = $profile->portrait;
        $this->assertNotNull($photo);
        Storage::disk('public')->assertExists($photo->path);

        $certificate = $profile->documents->first();
        $this->assertSame('Laurea in Scienze Motorie', $certificate?->title);
        $this->assertSame(2016, $certificate?->year);
        Storage::disk('local')->assertExists((string) $certificate?->path);

        $this->get(route('trainer.register'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('submitted', true)
                ->where('previewHref', route('trainers.show', 'giulia-rossi', false))
            );
    }

    public function test_a_client_becomes_a_trainer_with_the_same_account()
    {
        $client = User::factory()->create(['name' => 'Luca Moretti']);

        $this->actingAs($client)
            ->post(route('trainer.register.store'), ['terms' => '1', ...$this->profile()])
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('trainer.register', absolute: false));

        $this->assertSame(UserRole::Trainer, $client->refresh()->role);
        $this->assertSame(1, User::count());
        $this->assertSame('luca-moretti', $client->trainerProfile?->slug);
    }

    public function test_every_step_is_checked_and_nothing_is_saved_on_errors()
    {
        $client = User::factory()->create();

        $this->actingAs($client)
            ->post(route('trainer.register.store'), [
                'terms' => '1',
                ...$this->profile([
                    'bio' => 'Troppo corta',
                    'disciplines' => ['pilates', 'yoga', 'boxe', 'running', 'crossfit', 'functional'],
                    // Training goals only: nothing else is accepted.
                    'goals' => ['guarire'],
                    'studios' => [],
                    'city' => '',
                    'sessions' => [],
                    'hours' => [0 => [5]],
                ]),
            ])
            ->assertSessionHasErrors([
                'bio', 'disciplines', 'goals.0', 'studios', 'city', 'sessions', 'hours.0.0',
            ]);

        $this->assertSame(UserRole::Client, $client->refresh()->role);
        $this->assertSame(0, TrainerProfile::count());
    }

    public function test_a_new_profile_needs_photo_title_bio_and_experience()
    {
        $this->actingAs(User::factory()->create())
            ->post(route('trainer.register.store'), [
                'terms' => '1',
                ...$this->profile(['photo' => null, 'headline' => '', 'bio' => '', 'experience' => '']),
            ])
            ->assertSessionHasErrors(['photo', 'headline', 'bio', 'experience']);

        $this->assertSame(0, TrainerProfile::count());
    }

    public function test_a_profile_needs_at_least_one_goal()
    {
        $this->actingAs(User::factory()->create())
            ->post(route('trainer.register.store'), [
                'terms' => '1',
                ...$this->profile(['goals' => []]),
            ])
            ->assertSessionHasErrors(['goals' => 'Scegli almeno un obiettivo.']);

        $this->assertSame(0, TrainerProfile::count());
    }

    public function test_a_profile_has_at_most_three_goals()
    {
        $this->actingAs(User::factory()->create())
            ->post(route('trainer.register.store'), [
                'terms' => '1',
                ...$this->profile(['goals' => ['weight_loss', 'muscle', 'posture', 'athletic']]),
            ])
            ->assertSessionHasErrors(['goals' => 'Puoi scegliere al massimo 3 obiettivi.']);

        $this->assertSame(0, TrainerProfile::count());
    }

    public function test_the_limits_of_places_cities_and_certifications()
    {
        $certification = fn (string $title) => ['title' => $title, 'issuer' => 'Scuola', 'year' => '2020'];

        $this->actingAs(User::factory()->create())
            ->post(route('trainer.register.store'), [
                'terms' => '1',
                ...$this->profile([
                    'studios' => array_fill(0, 4, ['name' => 'Studio', 'address' => 'Via Roma 1']),
                    'other_cities' => ['monza', 'bergamo', 'como'],
                    'certifications' => [$certification('A'), $certification('B'), $certification('C'), $certification('D')],
                ]),
            ])
            ->assertSessionHasErrors(['studios', 'other_cities', 'certifications']);
    }

    public function test_the_certification_year_must_be_real()
    {
        $this->actingAs(User::factory()->create())
            ->post(route('trainer.register.store'), [
                'terms' => '1',
                ...$this->profile(['certifications' => [['title' => 'Corso', 'issuer' => 'Scuola', 'year' => '6500']]]),
            ])
            ->assertSessionHasErrors('certifications.0.year');
    }

    public function test_a_certification_needs_title_issuer_and_year()
    {
        $this->actingAs(User::factory()->create())
            ->post(route('trainer.register.store'), [
                'terms' => '1',
                // Only the year: the other fields become required.
                ...$this->profile(['certifications' => [['title' => '', 'issuer' => '', 'year' => '2020']]]),
            ])
            ->assertSessionHasErrors(['certifications.0.title', 'certifications.0.issuer']);

        $this->actingAs(User::factory()->create())
            ->post(route('trainer.register.store'), [
                'terms' => '1',
                // Only the title: the year (and the issuer) too.
                ...$this->profile(['certifications' => [['title' => 'Corso', 'issuer' => '', 'year' => '']]]),
            ])
            ->assertSessionHasErrors(['certifications.0.issuer', 'certifications.0.year']);

        $this->assertSame(0, TrainerProfile::count());
    }

    public function test_the_bio_has_from_60_to_500_characters()
    {
        $this->actingAs(User::factory()->create())
            ->post(route('trainer.register.store'), ['terms' => '1', ...$this->profile(['bio' => str_repeat('a', 59)])])
            ->assertSessionHasErrors('bio');

        $this->actingAs(User::factory()->create())
            ->post(route('trainer.register.store'), ['terms' => '1', ...$this->profile(['bio' => str_repeat('a', 501)])])
            ->assertSessionHasErrors('bio');

        $this->actingAs(User::factory()->create())
            ->post(route('trainer.register.store'), ['terms' => '1', ...$this->profile(['bio' => str_repeat('a', 60)])])
            ->assertSessionHasNoErrors();
    }

    public function test_hours_go_from_6_to_24_and_sessions_can_have_no_limit()
    {
        $client = User::factory()->create();

        $this->actingAs($client)
            ->post(route('trainer.register.store'), [
                'terms' => '1',
                // As the page sends "Nessun limite": an empty value.
                ...$this->profile(['hours' => [0 => [6, 7, 22, 23]], 'max_sessions_per_day' => '']),
            ])
            ->assertSessionHasNoErrors();

        $profile = $client->refresh()->trainerProfile;
        $this->assertNull($profile?->max_sessions_per_day);
        $this->assertSame(
            [['06:00', '08:00'], ['22:00', '24:00']],
            $profile?->workingHours->map(fn ($range) => [substr($range->starts_at, 0, 5), substr($range->ends_at, 0, 5)])->all(),
        );
    }

    public function test_the_registration_needs_at_least_one_open_hour()
    {
        $client = User::factory()->create();

        // A week without hours: in the form the empty days are not sent at all.
        $this->actingAs($client)
            ->post(route('trainer.register.store'), ['terms' => '1', ...$this->profile(['hours' => []])])
            ->assertSessionHasErrors(['hours' => 'Apri almeno un’ora nella settimana.']);

        $this->assertSame(UserRole::Client, $client->refresh()->role);
    }

    public function test_services_and_prices_become_the_services_of_the_profile()
    {
        $client = User::factory()->create();

        $this->actingAs($client)
            ->post(route('trainer.register.store'), [
                'terms' => '1',
                ...$this->profile([
                    'sessions' => [$this->sessionType([
                        'online_prices' => [['minutes' => '90', 'price_cents' => '5000'], ['minutes' => '60', 'price_cents' => '3500']],
                        'online_note' => 'in videochiamata',
                    ])],
                    'first_session' => ['minutes' => '30', 'price_cents' => '0', 'note' => 'per conoscerci'],
                    'packages' => [['sessions' => '10', 'minutes' => '90', 'price_cents' => '55000', 'note' => '']],
                ]),
            ])
            ->assertSessionHasNoErrors();

        $profile = $client->refresh()->trainerProfile;
        $this->assertNotNull($profile);
        $this->assertSame(
            [
                // The first session on top, then one row for each duration, with its own price.
                // The online rows of a kind of session have its same name.
                ['Prima seduta', 'session', 30, 0, false, true, false, null, 'per conoscerci'],
                ['Seduta singola', 'session', 60, 4500, false, false, false, null, 'in studio o a domicilio'],
                ['Seduta singola', 'session', 90, 6000, false, false, false, null, 'in studio o a domicilio'],
                ['Seduta singola', 'session', 60, 3500, false, false, true, null, 'in videochiamata'],
                ['Seduta singola', 'session', 90, 5000, false, false, true, null, 'in videochiamata'],
                ['Pacchetto 10 sedute', 'package', 90, 55000, false, true, false, 10, null],
            ],
            $profile->services->sortBy('sort')->map(fn ($service) => [
                $service->name, $service->kind, $service->minutes, $service->price_cents, $service->price_per_hour,
                $service->fixed_duration, $service->online_only, $service->package_sessions, $service->note,
            ])->values()->all(),
        );
        // The lowest price of a session: online.
        $this->assertSame(3500, $profile->price_from_cents);
        $this->assertSame([30, 60, 90], $profile->session_minutes);

        // Opened again to fix it, the page gets the same answers back.
        $profile->forceFill(['status' => TrainerProfileStatus::Changes])->save();
        $this->get(route('trainer.register'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('draft.pricing.sessions', 1)
                ->where('draft.pricing.sessions.0.name', 'Seduta singola')
                ->where('draft.pricing.sessions.0.prices', [['minutes' => 60, 'priceCents' => 4500], ['minutes' => 90, 'priceCents' => 6000]])
                ->where('draft.pricing.onlineSamePrice', false)
                ->where('draft.pricing.sessions.0.online', [['minutes' => 60, 'priceCents' => 3500], ['minutes' => 90, 'priceCents' => 5000]])
                ->where('draft.pricing.sessions.0.onlineNote', 'in videochiamata')
                ->where('draft.pricing.firstSession.enabled', true)
                ->where('draft.pricing.firstSession.priceCents', 0)
                ->where('draft.pricing.packages.0.sessions', 10)
                ->where('draft.pricing.packages.0.minutes', 90)
            );
    }

    public function test_the_online_prices_count_only_with_online_and_in_person()
    {
        $client = User::factory()->create();
        $onlinePrices = [['minutes' => '60', 'price_cents' => '2000'], ['minutes' => '90', 'price_cents' => '3000']];

        // No "Online" in the places: the online prices are ignored.
        $this->actingAs($client)
            ->post(route('trainer.register.store'), [
                'terms' => '1',
                ...$this->profile(['places' => ['home'], 'studios' => [], 'sessions' => [$this->sessionType(['online_prices' => $onlinePrices])]]),
            ])
            ->assertSessionHasNoErrors();

        $profile = $client->refresh()->trainerProfile;
        $this->assertSame(['Prima seduta', 'Seduta singola', 'Seduta singola'], $profile?->services->sortBy('sort')->pluck('name')->values()->all());
        $this->assertSame(4500, $profile?->price_from_cents);
    }

    public function test_the_online_prices_need_the_same_durations_as_their_kind_of_session()
    {
        $this->actingAs(User::factory()->create())
            ->post(route('trainer.register.store'), [
                'terms' => '1',
                // 60 and 90 minutes in "Seduta singola", only 60 online.
                ...$this->profile(['sessions' => [$this->sessionType(['online_prices' => [['minutes' => '60', 'price_cents' => '3500']]])]]),
            ])
            ->assertSessionHasErrors('sessions.0.online_prices');

        $this->assertSame(0, TrainerProfile::count());
    }

    public function test_more_kinds_of_session_each_with_its_name_and_prices()
    {
        $client = User::factory()->create();

        $this->actingAs($client)
            ->post(route('trainer.register.store'), [
                'terms' => '1',
                ...$this->profile([
                    'sessions' => [
                        $this->sessionType(['name' => 'Calisthenics', 'prices' => [['minutes' => '60', 'price_cents' => '4000']], 'note' => 'al parco']),
                        $this->sessionType([
                            'name' => 'Crossfit',
                            'prices' => [['minutes' => '60', 'price_cents' => '5000']],
                            'note' => '',
                            'online_prices' => [['minutes' => '60', 'price_cents' => '3000']],
                        ]),
                    ],
                ]),
            ])
            ->assertSessionHasNoErrors();

        $profile = $client->refresh()->trainerProfile;
        $this->assertNotNull($profile);
        $this->assertSame(
            [
                ['Prima seduta', 60, 3000, false],
                ['Calisthenics', 60, 4000, false],
                ['Crossfit', 60, 5000, false],
                ['Crossfit', 60, 3000, true],
            ],
            $profile->services->sortBy('sort')->map(fn ($service) => [$service->name, $service->minutes, $service->price_cents, $service->online_only])->values()->all(),
        );
        // Online prices sent for one kind only: the other kind gets none.
        $this->assertSame(3000, $profile->price_from_cents);

        // The profile shows each kind as a service of its own.
        $profile->forceFill(['status' => TrainerProfileStatus::Approved])->save();
        $this->get(route('trainers.show', $profile->slug))
            ->assertInertia(fn (Assert $page) => $page
                ->where('trainer.services.0.name', 'Prima seduta')
                ->where('trainer.services.1.name', 'Calisthenics')
                ->where('trainer.services.1.note', 'al parco')
                ->where('trainer.services.2.name', 'Crossfit')
                ->where('trainer.services.2.priceCents', 5000)
                ->where('trainer.services.3.name', 'Crossfit (online)')
                ->has('trainer.services', 4)
            );
    }

    public function test_the_names_of_the_kinds_of_session_are_checked()
    {
        $this->actingAs(User::factory()->create())
            ->post(route('trainer.register.store'), [
                'terms' => '1',
                ...$this->profile([
                    'sessions' => [
                        $this->sessionType(['name' => 'Crossfit']),
                        // The same name with other capitals, the name of the first session, no name.
                        $this->sessionType(['name' => 'crossfit']),
                        $this->sessionType(['name' => 'prima seduta']),
                        $this->sessionType(['name' => '']),
                    ],
                ]),
            ])
            ->assertSessionHasErrors(['sessions.1.name', 'sessions.2.name', 'sessions.3.name']);

        $this->assertSame(0, TrainerProfile::count());
    }

    public function test_prices_and_packages_are_checked()
    {
        $package = ['sessions' => '10', 'minutes' => '60', 'price_cents' => '40000', 'note' => ''];

        $this->actingAs(User::factory()->create())
            ->post(route('trainer.register.store'), [
                'terms' => '1',
                ...$this->profile([
                    // 50 cents, a duration that can't be chosen, the same duration twice.
                    'sessions' => [$this->sessionType(['prices' => [
                        ['minutes' => '60', 'price_cents' => '50'],
                        ['minutes' => '45', 'price_cents' => '3000'],
                        ['minutes' => '60', 'price_cents' => '4000'],
                    ]])],
                    'first_session' => ['minutes' => '45', 'price_cents' => '-1'],
                    'packages' => [$package, $package, $package, $package],
                ]),
            ])
            ->assertSessionHasErrors([
                'sessions.0.prices.0.price_cents', 'sessions.0.prices.1.minutes', 'sessions.0.prices',
                'first_session.minutes', 'first_session.price_cents', 'packages',
            ]);

        $this->assertSame(0, TrainerProfile::count());
    }

    public function test_every_price_can_be_at_most_10000_euros()
    {
        $tooMuch = '1000001';
        $package = ['sessions' => '10', 'minutes' => '60', 'price_cents' => $tooMuch, 'note' => ''];

        $this->actingAs(User::factory()->create())
            ->post(route('trainer.register.store'), [
                'terms' => '1',
                ...$this->profile([
                    'sessions' => [$this->sessionType(['prices' => [['minutes' => '60', 'price_cents' => $tooMuch]]])],
                    'first_session' => ['minutes' => '60', 'price_cents' => $tooMuch],
                    'packages' => [$package],
                ]),
            ])
            ->assertSessionHasErrors(['sessions.0.prices.0.price_cents', 'first_session.price_cents', 'packages.0.price_cents']);

        $this->assertSame(0, TrainerProfile::count());

        // 10.000 € exactly is fine.
        $this->actingAs(User::factory()->create())
            ->post(route('trainer.register.store'), [
                'terms' => '1',
                ...$this->profile(['sessions' => [$this->sessionType(['prices' => [['minutes' => '60', 'price_cents' => '1000000']]])]]),
            ])
            ->assertSessionHasNoErrors();

        $this->assertSame(1, TrainerProfile::count());
    }

    public function test_an_online_only_trainer_needs_no_city()
    {
        $client = User::factory()->create();

        $this->actingAs($client)
            ->post(route('trainer.register.store'), [
                'terms' => '1',
                ...$this->profile(['places' => ['online'], 'city' => '', 'other_cities' => [], 'studios' => []]),
            ])
            ->assertSessionHasNoErrors();

        $profile = $client->refresh()->trainerProfile;
        $this->assertNull($profile?->city_id);
        $this->assertFalse($profile?->trains_in_person);
    }

    public function test_after_changes_the_trainer_sends_the_profile_again()
    {
        $client = User::factory()->create();
        $this->actingAs($client)->post(route('trainer.register.store'), ['terms' => '1', ...$this->profile()]);

        $profile = $client->refresh()->trainerProfile;
        $this->assertNotNull($profile);
        $oldFile = (string) $profile->documents->first()?->path;
        $profile->forceFill(['status' => TrainerProfileStatus::Changes])->save();
        $profile->decisions()->create([
            'decision' => TrainerReviewDecision::Changes,
            'reasons' => ['Bio con contatti o link'],
            'message_to_trainer' => 'Togli il numero dalla bio.',
        ]);

        // The page opens on step 2 with what was sent and the team's request.
        $this->get(route('trainer.register'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('editing', true)
                ->where('draft.headline', 'Functional training e Pilates')
                ->where('draft.city', 'milano')
                ->where('draft.hours.0', [7, 8, 9, 10, 11, 18, 19, 20])
                ->where('draft.certifications.0.hasFile', true)
                ->where('changeRequest', ['reasons' => ['Bio con contatti o link'], 'message' => 'Togli il numero dalla bio.'])
            );

        // Sent again without a new file: the certificate keeps its file.
        $certificationId = $profile->documents->first()?->id;
        $this->post(route('trainer.register.store'), $this->profile([
            'headline' => 'Pilates e postura',
            'certifications' => [['id' => $certificationId, 'title' => 'Laurea in Scienze Motorie', 'issuer' => 'Università di Milano', 'year' => '2016']],
        ]))->assertSessionHasNoErrors();

        $profile->refresh();
        $this->assertSame(TrainerProfileStatus::Review, $profile->status);
        $this->assertSame('Pilates e postura', $profile->headline);
        $this->assertSame($oldFile, $profile->documents()->first()?->path);
        Storage::disk('local')->assertExists($oldFile);

        // "Profilo inviato" once, then it waits for the team again.
        $this->get(route('trainer.register'))->assertInertia(fn (Assert $page) => $page->where('submitted', true));
        $this->get(route('trainer.register'))->assertRedirect(route('trainer.today'));
    }

    public function test_a_trainer_made_by_the_team_can_complete_the_profile()
    {
        $trainer = User::factory()->trainer()->create();

        $this->actingAs($trainer)
            ->get(route('trainer.register'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('editing', true)->where('draft', null));

        $this->post(route('trainer.register.store'), $this->profile())->assertSessionHasNoErrors();
        $this->assertNotNull($trainer->refresh()->trainerProfile);
    }

    public function test_continua_checks_the_photo_in_step_2()
    {
        $client = User::factory()->create();

        // Only the fields of step 2, as the page sends them.
        $this->actingAs($client)
            ->post(route('trainer.register.check', 2), [
                'headline' => 'Functional training e Pilates',
                'bio' => str_repeat('Alleno persone che vogliono tornare in forma. ', 5),
                'experience' => '5to10',
                'photo' => UploadedFile::fake()->image('piccola.jpg', 200, 200),
            ])
            ->assertSessionHasErrors(['photo' => 'La foto deve essere almeno 400 × 400 px.'])
            // The next steps are not filled in yet: no errors about them.
            ->assertSessionDoesntHaveErrors(['disciplines', 'city', 'sessions', 'hours']);

        $this->assertSame(UserRole::Client, $client->refresh()->role);
        $this->assertSame(0, TrainerProfile::count());
    }

    public function test_continua_goes_on_when_the_step_is_right_and_saves_nothing()
    {
        $client = User::factory()->create();

        $this->actingAs($client)
            ->post(route('trainer.register.check', 2), [
                'headline' => 'Functional training e Pilates',
                'bio' => str_repeat('Alleno persone che vogliono tornare in forma. ', 5),
                'experience' => '5to10',
                'photo' => UploadedFile::fake()->image('ritratto.jpg', 600, 600),
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('trainer.register', absolute: false));

        $this->assertSame(UserRole::Client, $client->refresh()->role);
        $this->assertSame(0, TrainerProfile::count());
        $this->assertSame([], Storage::disk('public')->allFiles());
    }

    public function test_continua_checks_only_the_step_being_left()
    {
        $this->actingAs(User::factory()->create())
            ->post(route('trainer.register.check', 3), [
                'disciplines' => ['pilates'],
                'goals' => ['posture'],
                'places' => ['studio'],
                'studios' => [],
                'city' => 'milano',
            ])
            ->assertSessionHasErrors(['studios'])
            ->assertSessionDoesntHaveErrors(['headline', 'photo', 'sessions', 'hours', 'terms']);
    }

    public function test_continua_checks_the_account_of_a_guest_in_step_1()
    {
        User::factory()->create(['email' => 'giulia@example.com']);

        $this->post(route('trainer.register.check', 1), [
            'first_name' => 'Giulia',
            'last_name' => 'Rossi',
            'email' => 'giulia@example.com',
            'phone' => '347 521 8846',
            'password' => 'Password1',
            'terms' => '1',
        ])
            ->assertSessionHasErrors(['email'])
            ->assertSessionDoesntHaveErrors(['headline', 'photo']);

        $this->assertGuest();
        $this->assertSame(1, User::count());
    }

    public function test_a_trainer_waiting_for_the_team_cannot_check_a_step()
    {
        $trainer = User::factory()->trainer()->create();
        TrainerProfile::factory()->for($trainer)->status(TrainerProfileStatus::Review)->create();

        $this->actingAs($trainer)
            ->post(route('trainer.register.check', 2), [])
            ->assertRedirect(route('trainer.today'));
    }
}
