<?php

namespace App\Http\Controllers;

use App\Actions\GroupSessions\CourseLessonSessions;
use App\Enums\CourseLevel;
use App\Http\Controllers\Concerns\BuildsGymArea;
use App\Models\Discipline;
use App\Models\GymCourse;
use App\Models\GymCourseLesson;
use App\Models\GymPhoto;
use App\Models\GymProfile;
use App\Models\TrainerProfile;
use App\Support\GymCourseWeek;
use App\Support\SafeImage;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator as ValidatorFacade;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Validator;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Corsi" of the gym area: each course with its weekly lessons, public at
 * once as the plan of the week on the profile. A lesson can be called off on
 * one day ("Annulla questa lezione"). With "Prenotazione posto" the clients
 * take a place in each lesson (CourseLessonSessions); else booked at the gym.
 */
class GymCoursesController extends Controller
{
    use BuildsGymArea;

    public function __construct(private CourseLessonSessions $lessonSessions) {}

    /** "Questa settimana" and "La prossima" in the plan. */
    private const WEEKS = 2;

    public function show(): Response
    {
        $profile = $this->gymOrFail();
        $monday = GymCourseWeek::thisMonday();

        return Inertia::render('gym/courses', [
            'gymArea' => $this->gymArea(),
            'courses' => $profile->courses()->with('lessons')->get()->map(fn (GymCourse $course) => [
                'id' => $course->id,
                'name' => $course->name,
                'description' => $course->description ?? '',
                'disciplineId' => $course->discipline_id,
                'level' => $course->level->value,
                'instructorTrainerId' => $course->instructor_trainer_id,
                'instructorName' => $course->instructor_name ?? '',
                'photoUrl' => $course->photoUrl(),
                'isActive' => $course->is_active,
                'bookable' => $course->bookable,
                'lessons' => $course->lessons->map(fn (GymCourseLesson $lesson) => [
                    'id' => $lesson->id,
                    'weekday' => $lesson->weekday,
                    'start' => $lesson->startTime(),
                    'end' => $lesson->endTime(),
                    'room' => $lesson->room ?? '',
                    'capacity' => $lesson->capacity,
                ])->values(),
            ])->values(),
            'weeks' => array_map(
                fn (int $week) => GymCourseWeek::days($profile, $monday->addWeeks($week), withHidden: true),
                range(0, self::WEEKS - 1),
            ),
            'disciplines' => Discipline::query()->where('is_active', true)->orderBy('sort')->orderBy('name')->get()
                ->map(fn (Discipline $discipline) => ['value' => (string) $discipline->id, 'label' => $discipline->name])->values(),
            'levels' => CourseLevel::options(),
            // "Istruttore": the trainers of MioPersonal who work here, or a name.
            'trainers' => $profile->trainers()->with('user')->get()
                ->map(fn (TrainerProfile $trainer) => ['value' => (string) $trainer->id, 'label' => $trainer->user->name])->values(),
            'max' => GymProfile::MAX_COURSES,
            'maxLessons' => GymCourse::MAX_LESSONS,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $profile = $this->gymOrFail();

        if ($profile->courses()->count() >= GymProfile::MAX_COURSES) {
            return back()->withErrors(['course' => 'Puoi aggiungere al massimo '.GymProfile::MAX_COURSES.' corsi.']);
        }

        $this->save($request, $profile, new GymCourse(['sort' => (int) $profile->courses()->max('sort') + 1]));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Corso aggiunto.']);

        return to_route('gym.courses');
    }

    /** A POST, not a PUT: the form may send a photo. */
    public function update(Request $request, GymCourse $course): RedirectResponse
    {
        $profile = $this->gymOrFail();
        $this->ensureOwn($profile, $course);

        $this->save($request, $profile, $course);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Corso salvato.']);

        return to_route('gym.courses');
    }

    public function destroy(GymCourse $course): RedirectResponse
    {
        $profile = $this->gymOrFail();
        $this->ensureOwn($profile, $course);

        $photo = $course->photo_path;

        // The places taken in its next lessons: cancelled, the clients told.
        foreach ($course->lessons as $lesson) {
            $this->lessonSessions->retire($lesson, 'Il corso non è più in programma.');
        }

        $course->delete();

        if ($photo !== null) {
            Storage::disk(GymPhoto::DISK)->delete($photo);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Corso eliminato.']);

        return to_route('gym.courses');
    }

    /** "Annulla questa lezione": only that day, from today on. */
    public function cancelLesson(Request $request, GymCourseLesson $lesson): RedirectResponse
    {
        $this->ensureOwnLesson($lesson);
        $date = $this->lessonDate($request, $lesson);

        $request->validate(['note' => ['nullable', 'string', 'max:120']], [
            'note.max' => 'Il messaggio può avere al massimo 120 caratteri.',
        ]);

        $lesson->cancellations()->updateOrCreate(
            ['date' => $date->toDateString()],
            ['note' => filled($request->input('note')) ? trim($request->string('note')->value()) : null],
        );

        $this->lessonSessions->cancelDate($lesson, $date, filled($request->input('note')) ? trim($request->string('note')->value()) : null);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Lezione annullata.']);

        return back();
    }

    /** "Ripristina": the lesson takes place again that day. */
    public function restoreLesson(Request $request, GymCourseLesson $lesson): RedirectResponse
    {
        $this->ensureOwnLesson($lesson);
        $date = $this->lessonDate($request, $lesson);

        $lesson->cancellations()->whereDate('date', $date->toDateString())->delete();
        $this->lessonSessions->restoreDate($lesson, $date);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Lezione ripristinata.']);

        return back();
    }

    /** "Iscritti" of a lesson on a day: its page in "Eventi", with the places left. */
    public function lessonClients(Request $request, GymCourseLesson $lesson): RedirectResponse
    {
        $this->ensureOwnLesson($lesson);
        abort_unless($lesson->course->bookable && $lesson->capacity !== null, 404);

        $session = $this->lessonSessions->occurrence($lesson, $this->lessonDate($request, $lesson));

        return to_route('gym.events.show', $session);
    }

    private function save(Request $request, GymProfile $profile, GymCourse $course): void
    {
        $data = $this->validated($request, $profile);
        $file = $request->file('photo');
        $oldPhoto = null;
        $newPhoto = null;

        if ($file instanceof UploadedFile) {
            $newPhoto = SafeImage::store($file, "gyms/{$profile->id}/courses", GymPhoto::DISK);
            $oldPhoto = $course->photo_path;
        } elseif ($request->boolean('remove_photo')) {
            $oldPhoto = $course->photo_path;
        }

        try {
            DB::transaction(function () use ($profile, $course, $data, $file, $newPhoto, $request) {
                $trainerId = filled($data['instructor_trainer_id'] ?? null) ? (int) $data['instructor_trainer_id'] : null;

                $course->fill([
                    'name' => trim($data['name']),
                    'description' => filled($data['description'] ?? null) ? trim($data['description']) : null,
                    'discipline_id' => filled($data['discipline_id'] ?? null) ? (int) $data['discipline_id'] : null,
                    'level' => CourseLevel::from($data['level']),
                    'instructor_trainer_id' => $trainerId,
                    // A trainer of MioPersonal has their own name.
                    'instructor_name' => $trainerId === null && filled($data['instructor_name'] ?? null) ? trim($data['instructor_name']) : null,
                    'is_active' => (bool) ($data['is_active'] ?? true),
                    'bookable' => (bool) ($data['bookable'] ?? false),
                ]);

                if ($file instanceof UploadedFile) {
                    $course->photo_path = $newPhoto;
                } elseif ($request->boolean('remove_photo')) {
                    $course->photo_path = null;
                }

                $course->gymProfile()->associate($profile);
                $course->save();

                $this->saveLessons($course, $data['lessons']);
            });
        } catch (\Throwable $exception) {
            if ($newPhoto !== null) {
                Storage::disk(GymPhoto::DISK)->delete($newPhoto);
            }

            throw $exception;
        }

        if ($oldPhoto !== null) {
            Storage::disk(GymPhoto::DISK)->delete($oldPhoto);
        }
    }

    /**
     * A lesson sent with its id is updated (its cancellations stay), the
     * missing ones are deleted.
     *
     * @param  list<array<string, mixed>>  $rows
     */
    private function saveLessons(GymCourse $course, array $rows): void
    {
        $existing = $course->lessons()->get()->keyBy('id');
        $kept = [];

        foreach ($rows as $row) {
            $attributes = [
                'weekday' => (int) $row['weekday'],
                'starts_at' => $row['start'],
                'ends_at' => $row['end'],
                'room' => filled($row['room'] ?? null) ? trim((string) $row['room']) : null,
                'capacity' => filled($row['capacity'] ?? null) ? (int) $row['capacity'] : null,
            ];

            $lesson = $existing->get((int) ($row['id'] ?? 0));

            if ($lesson !== null) {
                $lesson->update($attributes);
                // Its next days with places taken follow the new time and places.
                $this->lessonSessions->sync($lesson);
                $kept[] = $lesson->id;
            } else {
                $kept[] = $course->lessons()->create($attributes)->id;
            }
        }

        foreach ($existing->except($kept) as $gone) {
            $this->lessonSessions->retire($gone);
            $gone->delete();
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, GymProfile $profile): array
    {
        $trainerIds = $profile->trainers()->pluck('trainer_profiles.id')->all();

        return ValidatorFacade::make($request->all(), [
            'name' => ['required', 'string', 'max:'.GymCourse::NAME_MAX],
            'description' => ['nullable', 'string', 'max:'.GymCourse::DESCRIPTION_MAX],
            'discipline_id' => ['nullable', 'integer', Rule::exists(Discipline::class, 'id')->where('is_active', true)],
            'level' => ['required', Rule::enum(CourseLevel::class)],
            'instructor_trainer_id' => ['nullable', 'integer', Rule::in($trainerIds)],
            'instructor_name' => ['nullable', 'string', 'max:80'],
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png', 'max:5120', 'dimensions:min_width=800,min_height=500'],
            'remove_photo' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
            'bookable' => ['nullable', 'boolean'],
            'lessons' => ['required', 'array', 'min:1', 'max:'.GymCourse::MAX_LESSONS],
            'lessons.*.id' => ['nullable', 'integer'],
            'lessons.*.weekday' => ['required', 'integer', 'between:1,7'],
            'lessons.*.start' => ['required', 'date_format:H:i'],
            'lessons.*.end' => ['required', 'date_format:H:i'],
            'lessons.*.room' => ['nullable', 'string', 'max:60'],
            // "Prenotazione posto": each lesson says how many places it has.
            'lessons.*.capacity' => [$request->boolean('bookable') ? 'required' : 'nullable', 'integer', 'between:1,500'],
        ], [
            'name.required' => 'Scrivi il nome del corso.',
            'name.max' => 'Il nome può avere al massimo '.GymCourse::NAME_MAX.' caratteri.',
            'description.max' => 'La descrizione può avere al massimo '.GymCourse::DESCRIPTION_MAX.' caratteri.',
            'discipline_id.*' => 'Scegli una disciplina dell’elenco.',
            'level.*' => 'Scegli il livello del corso.',
            'instructor_trainer_id.*' => 'Scegli uno dei trainer che lavorano nella tua palestra.',
            'instructor_name.max' => 'Il nome dell’istruttore può avere al massimo 80 caratteri.',
            'photo.image' => 'La foto deve essere un’immagine JPG o PNG.',
            'photo.mimes' => 'La foto deve essere un’immagine JPG o PNG.',
            'photo.max' => 'La foto può pesare al massimo 5 MB.',
            'photo.dimensions' => 'La foto deve essere almeno 800 × 500 px.',
            'lessons.required' => 'Aggiungi almeno una lezione nella settimana.',
            'lessons.min' => 'Aggiungi almeno una lezione nella settimana.',
            'lessons.max' => 'Al massimo '.GymCourse::MAX_LESSONS.' lezioni a settimana.',
            'lessons.*.weekday.*' => 'Scegli il giorno di ogni lezione.',
            'lessons.*.start.*' => 'Scrivi l’ora di inizio di ogni lezione.',
            'lessons.*.end.*' => 'Scrivi l’ora di fine di ogni lezione.',
            'lessons.*.room.max' => 'La sala può avere al massimo 60 caratteri.',
            'lessons.*.capacity.required' => 'Con la prenotazione del posto, scrivi i posti di ogni lezione.',
            'lessons.*.capacity.*' => 'I posti devono essere da 1 a 500.',
        ])->after(function (Validator $validator) use ($request) {
            // Each lesson ends after it starts: the rules can't compare two fields of a row.
            foreach ((array) $request->input('lessons', []) as $index => $lesson) {
                if (is_array($lesson) && is_string($lesson['start'] ?? null) && is_string($lesson['end'] ?? null) && $lesson['end'] <= $lesson['start']) {
                    $validator->errors()->add("lessons.{$index}.end", 'Ogni lezione deve finire dopo l’inizio.');
                }
            }
        })->validate();
    }

    private function ensureOwn(GymProfile $profile, GymCourse $course): void
    {
        abort_unless($course->gym_profile_id === $profile->id, 404);
    }

    private function ensureOwnLesson(GymCourseLesson $lesson): void
    {
        $this->ensureOwn($this->gymOrFail(), $lesson->course);
    }

    /** The day asked, a day of that lesson, not past. */
    private function lessonDate(Request $request, GymCourseLesson $lesson): CarbonImmutable
    {
        $request->validate(['date' => ['required', 'date_format:Y-m-d']], ['date.*' => 'Scegli il giorno della lezione.']);

        $date = CarbonImmutable::createFromFormat('Y-m-d', $request->string('date')->value(), 'Europe/Rome')?->startOfDay();

        if ($date === null || $date->dayOfWeekIso !== $lesson->weekday || $date->lt(CarbonImmutable::now('Europe/Rome')->startOfDay())) {
            throw ValidationException::withMessages(['date' => 'Questa lezione non c’è quel giorno.']);
        }

        return $date;
    }
}
