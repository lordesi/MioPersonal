import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    CalendarDays,
    ExternalLink,
    Pencil,
    Plus,
    Trash2,
    X,
} from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import ChoiceChips from '@/components/shared/choice-chips';
import ConfirmDialog from '@/components/shared/confirm-dialog';
import SwitchRow from '@/components/shared/switch-row';
import PageHeading from '@/components/trainer/area/page-heading';
import Panel from '@/components/trainer/area/panel';
import SegmentedTabs from '@/components/trainer/area/segmented-tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { romeParts } from '@/lib/calendar';
import { cn } from '@/lib/utils';
import { destroy, store, update } from '@/routes/gym/courses';
import lessons from '@/routes/gym/courses/lessons';
import type { CatalogOption, GymAreaData, GymCourseDay } from '@/types';

type CoursesView = 'planner' | 'list';

type Lesson = {
    id: number | null;
    weekday: number;
    start: string;
    end: string;
    room: string;
    capacity: number | null;
};

type Course = {
    id: number;
    name: string;
    description: string;
    disciplineId: number | null;
    level: string;
    instructorTrainerId: number | null;
    instructorName: string;
    photoUrl: string | null;
    isActive: boolean;
    /** "Prenotazione posto": clients take a place in each lesson. */
    bookable: boolean;
    lessons: Lesson[];
};

type GymCoursesProps = {
    courses: Course[];
    /** This week and the next, also the courses switched off. */
    weeks: GymCourseDay[][];
    disciplines: CatalogOption[];
    levels: CatalogOption[];
    /** The trainers of MioPersonal who work at the gym. */
    trainers: CatalogOption[];
    max: number;
    maxLessons: number;
};

const WEEKDAYS = [
    'Lunedì',
    'Martedì',
    'Mercoledì',
    'Giovedì',
    'Venerdì',
    'Sabato',
    'Domenica',
];

const NONE = 'none';

const emptyLesson: Lesson = {
    id: null,
    weekday: 1,
    start: '18:30',
    end: '19:30',
    room: '',
    capacity: null,
};

/**
 * "Corsi": each course with its weekly lessons, public at once as the plan
 * of the week; below, the plan of this week and the next one, where a
 * lesson can be called off on one day.
 */
export default function GymCourses({
    courses,
    weeks,
    disciplines,
    levels,
    trainers,
    max,
    maxLessons,
}: GymCoursesProps) {
    const publicProfileHref = usePage<{ gymArea?: GymAreaData }>().props.gymArea
        ?.publicProfileHref;
    // "Planner" for the week's work, "Elenco corsi" to create and edit: the
    // list first while there is nothing to plan, or when the link asks for it.
    const [view, setView] = useState<CoursesView>(() => {
        const asked = new URLSearchParams(window.location.search).get('vista');

        return asked === 'elenco' || courses.length === 0 ? 'list' : 'planner';
    });
    const [editing, setEditing] = useState<Course | 'new' | null>(null);
    const [deleting, setDeleting] = useState<Course | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const form = useForm({
        name: '',
        description: '',
        discipline_id: null as number | null,
        level: 'all',
        instructor_trainer_id: null as number | null,
        instructor_name: '',
        photo: null as File | null,
        remove_photo: false,
        is_active: true,
        bookable: false,
        lessons: [emptyLesson] as Lesson[],
    });

    const open = (course: Course | 'new') => {
        form.clearErrors();
        setPreview(null);
        form.setData(
            course === 'new'
                ? {
                      name: '',
                      description: '',
                      discipline_id: null,
                      level: 'all',
                      instructor_trainer_id: null,
                      instructor_name: '',
                      photo: null,
                      remove_photo: false,
                      is_active: true,
                      bookable: false,
                      lessons: [emptyLesson],
                  }
                : {
                      name: course.name,
                      description: course.description,
                      discipline_id: course.disciplineId,
                      level: course.level,
                      instructor_trainer_id: course.instructorTrainerId,
                      instructor_name: course.instructorName,
                      photo: null,
                      remove_photo: false,
                      is_active: course.isActive,
                      bookable: course.bookable,
                      lessons: course.lessons,
                  },
        );
        setEditing(course);
    };

    const submit = () => {
        const options = {
            forceFormData: true,
            preserveScroll: true,
            // Stay on the tab in use.
            preserveState: true,
            onSuccess: () => setEditing(null),
        };

        if (editing === 'new') {
            form.post(store.url(), options);
        } else if (editing) {
            form.post(update.url(editing.id), options);
        }
    };

    const changeLesson = (index: number, changes: Partial<Lesson>) =>
        form.setData(
            'lessons',
            form.data.lessons.map((lesson, i) =>
                i === index ? { ...lesson, ...changes } : lesson,
            ),
        );

    const shownPhoto =
        preview ??
        (editing && editing !== 'new' && !form.data.remove_photo
            ? editing.photoUrl
            : null);
    const errors = form.errors as Record<string, string | undefined>;
    const lessonError = Object.entries(errors).find(([field]) =>
        field.startsWith('lessons'),
    )?.[1];

    return (
        <>
            <Head title="Corsi" />

            <PageHeading
                title="Corsi"
                description={`Il planner della settimana sul tuo profilo pubblico. Corsi: ${courses.length} di ${max}.`}
                action={
                    <Button
                        type="button"
                        disabled={courses.length >= max}
                        onClick={() => open('new')}
                    >
                        <Plus aria-hidden="true" />
                        Nuovo corso
                    </Button>
                }
            />

            {courses.length > 0 && (
                <SegmentedTabs
                    label="Vista dei corsi"
                    controls="courses-view"
                    tabs={[
                        {
                            value: 'planner',
                            label: 'Planner',
                            count: (weeks[0] ?? []).reduce(
                                (total, day) =>
                                    total +
                                    day.lessons.filter(
                                        (lesson) => !lesson.cancelled,
                                    ).length,
                                0,
                            ),
                        },
                        {
                            value: 'list',
                            label: 'Elenco corsi',
                            count: courses.length,
                        },
                    ]}
                    value={view}
                    onChange={setView}
                />
            )}

            <div
                id="courses-view"
                role="tabpanel"
                className="flex flex-col gap-4"
            >
                {view === 'planner' && courses.length > 0 ? (
                    <WeekPlans weeks={weeks} />
                ) : courses.length === 0 ? (
                    <Panel>
                        <p className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CalendarDays
                                aria-hidden="true"
                                className="size-4"
                            />
                            Nessun corso. Es. “Pilates” il lunedì e il giovedì
                            alle 18:30, “Spinning” il sabato alle 10.
                        </p>
                    </Panel>
                ) : (
                    <ul className="grid gap-3 lg:grid-cols-2">
                        {courses.map((course) => (
                            <li key={course.id}>
                                <Panel
                                    title={course.name}
                                    action={
                                        <div className="flex items-center gap-1">
                                            {course.bookable && (
                                                <Badge variant="secondary">
                                                    Prenotabile
                                                </Badge>
                                            )}
                                            {!course.isActive && (
                                                <Badge variant="outline">
                                                    Nascosto
                                                </Badge>
                                            )}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                aria-label={`Modifica ${course.name}`}
                                                onClick={() => open(course)}
                                            >
                                                <Pencil aria-hidden="true" />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                aria-label={`Elimina ${course.name}`}
                                                onClick={() =>
                                                    setDeleting(course)
                                                }
                                            >
                                                <Trash2 aria-hidden="true" />
                                            </Button>
                                        </div>
                                    }
                                >
                                    <p className="text-sm text-muted-foreground">
                                        {course.lessons
                                            .map(
                                                (lesson) =>
                                                    `${WEEKDAYS[lesson.weekday - 1].slice(0, 3)} ${lesson.start}–${lesson.end}`,
                                            )
                                            .join(' · ')}
                                    </p>
                                    {publicProfileHref && course.isActive && (
                                        <Link
                                            href={`${publicProfileHref}?corso=${course.id}#corsi`}
                                            className="inline-flex items-center gap-1 self-start text-sm font-medium underline underline-offset-4"
                                        >
                                            <ExternalLink
                                                aria-hidden="true"
                                                className="size-3.5"
                                            />
                                            Vedi sul profilo pubblico
                                        </Link>
                                    )}
                                </Panel>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <Dialog
                open={editing !== null}
                onOpenChange={(isOpen) => !isOpen && setEditing(null)}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editing === 'new'
                                ? 'Nuovo corso'
                                : 'Modifica corso'}
                        </DialogTitle>
                        <DialogDescription>
                            Le lezioni si ripetono ogni settimana. Per saltarne
                            una, annullala dalla scheda Planner.
                        </DialogDescription>
                    </DialogHeader>
                    <form
                        id="course-form"
                        noValidate
                        className="flex flex-col gap-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            submit();
                        }}
                    >
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="course-name">Nome</Label>
                            <Input
                                id="course-name"
                                value={form.data.name}
                                maxLength={80}
                                placeholder="Es. Pilates matwork"
                                onChange={(event) =>
                                    form.setData('name', event.target.value)
                                }
                            />
                            <InputError message={errors.name} />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="flex flex-col gap-1.5">
                                <Label>Disciplina (facoltativa)</Label>
                                <Select
                                    value={
                                        form.data.discipline_id === null
                                            ? NONE
                                            : String(form.data.discipline_id)
                                    }
                                    onValueChange={(value) =>
                                        form.setData(
                                            'discipline_id',
                                            value === NONE
                                                ? null
                                                : Number(value),
                                        )
                                    }
                                >
                                    <SelectTrigger
                                        aria-label="Disciplina"
                                        className="w-full"
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={NONE}>
                                            Nessuna
                                        </SelectItem>
                                        {disciplines.map((item) => (
                                            <SelectItem
                                                key={item.value}
                                                value={item.value}
                                            >
                                                {item.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.discipline_id} />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label>Livello</Label>
                                <Select
                                    value={form.data.level}
                                    onValueChange={(value) =>
                                        form.setData('level', value)
                                    }
                                >
                                    <SelectTrigger
                                        aria-label="Livello"
                                        className="w-full"
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {levels.map((item) => (
                                            <SelectItem
                                                key={item.value}
                                                value={item.value}
                                            >
                                                {item.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="flex flex-col gap-1.5">
                                <Label>Istruttore</Label>
                                <Select
                                    value={
                                        form.data.instructor_trainer_id === null
                                            ? NONE
                                            : String(
                                                  form.data
                                                      .instructor_trainer_id,
                                              )
                                    }
                                    onValueChange={(value) =>
                                        form.setData(
                                            'instructor_trainer_id',
                                            value === NONE
                                                ? null
                                                : Number(value),
                                        )
                                    }
                                >
                                    <SelectTrigger
                                        aria-label="Istruttore"
                                        className="w-full"
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={NONE}>
                                            Scrivo il nome
                                        </SelectItem>
                                        {trainers.map((item) => (
                                            <SelectItem
                                                key={item.value}
                                                value={item.value}
                                            >
                                                {item.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError
                                    message={errors.instructor_trainer_id}
                                />
                            </div>
                            {form.data.instructor_trainer_id === null && (
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="course-instructor">
                                        Nome dell’istruttore (facoltativo)
                                    </Label>
                                    <Input
                                        id="course-instructor"
                                        value={form.data.instructor_name}
                                        maxLength={80}
                                        onChange={(event) =>
                                            form.setData(
                                                'instructor_name',
                                                event.target.value,
                                            )
                                        }
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="course-description">
                                Descrizione (facoltativa)
                            </Label>
                            <Textarea
                                id="course-description"
                                rows={3}
                                maxLength={1000}
                                placeholder="Cosa si fa, per chi è, cosa portare."
                                value={form.data.description}
                                onChange={(event) =>
                                    form.setData(
                                        'description',
                                        event.target.value,
                                    )
                                }
                            />
                            <InputError message={errors.description} />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="course-photo">
                                Foto (facoltativa)
                            </Label>
                            {shownPhoto && (
                                <div className="relative overflow-hidden rounded-xl">
                                    <img
                                        src={shownPhoto}
                                        alt=""
                                        className="aspect-16/9 w-full object-cover"
                                    />
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="secondary"
                                        aria-label="Togli la foto"
                                        className="absolute right-2 bottom-2 size-8"
                                        onClick={() => {
                                            setPreview(null);
                                            form.setData((data) => ({
                                                ...data,
                                                photo: null,
                                                remove_photo: true,
                                            }));
                                        }}
                                    >
                                        <Trash2 aria-hidden="true" />
                                    </Button>
                                </div>
                            )}
                            <Input
                                id="course-photo"
                                type="file"
                                accept="image/jpeg,image/png"
                                onChange={(event) => {
                                    const file =
                                        event.target.files?.[0] ?? null;
                                    setPreview(
                                        file ? URL.createObjectURL(file) : null,
                                    );
                                    form.setData((data) => ({
                                        ...data,
                                        photo: file,
                                        remove_photo: false,
                                    }));
                                }}
                            />
                            <InputError message={errors.photo} />
                        </div>

                        <fieldset className="flex flex-col gap-2">
                            <legend className="pb-1 text-sm font-medium">
                                Lezioni della settimana
                            </legend>
                            {form.data.lessons.map((lesson, index) => (
                                <div
                                    key={lesson.id ?? `new-${index}`}
                                    className="grid grid-cols-2 items-end gap-2 rounded-xl bg-muted/60 p-2.5 sm:grid-cols-[1.3fr_1fr_1fr_1.2fr_0.8fr_auto]"
                                >
                                    <Select
                                        value={String(lesson.weekday)}
                                        onValueChange={(value) =>
                                            changeLesson(index, {
                                                weekday: Number(value),
                                            })
                                        }
                                    >
                                        <SelectTrigger
                                            aria-label={`Giorno della lezione ${index + 1}`}
                                            className="w-full bg-background"
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {WEEKDAYS.map((label, day) => (
                                                <SelectItem
                                                    key={label}
                                                    value={String(day + 1)}
                                                >
                                                    {label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Input
                                        type="time"
                                        aria-label={`Inizio della lezione ${index + 1}`}
                                        className="bg-background"
                                        value={lesson.start}
                                        onChange={(event) =>
                                            changeLesson(index, {
                                                start: event.target.value,
                                            })
                                        }
                                    />
                                    <Input
                                        type="time"
                                        aria-label={`Fine della lezione ${index + 1}`}
                                        className="bg-background"
                                        value={lesson.end}
                                        onChange={(event) =>
                                            changeLesson(index, {
                                                end: event.target.value,
                                            })
                                        }
                                    />
                                    <Input
                                        aria-label={`Sala della lezione ${index + 1}`}
                                        placeholder="Sala"
                                        maxLength={60}
                                        className="bg-background"
                                        value={lesson.room}
                                        onChange={(event) =>
                                            changeLesson(index, {
                                                room: event.target.value,
                                            })
                                        }
                                    />
                                    <Input
                                        type="number"
                                        min={1}
                                        max={500}
                                        aria-label={`Posti della lezione ${index + 1}`}
                                        placeholder="Posti"
                                        className="bg-background"
                                        value={lesson.capacity ?? ''}
                                        onChange={(event) =>
                                            changeLesson(index, {
                                                capacity: event.target.value
                                                    ? Number(event.target.value)
                                                    : null,
                                            })
                                        }
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        aria-label={`Togli la lezione ${index + 1}`}
                                        disabled={
                                            form.data.lessons.length === 1
                                        }
                                        onClick={() =>
                                            form.setData(
                                                'lessons',
                                                form.data.lessons.filter(
                                                    (_, i) => i !== index,
                                                ),
                                            )
                                        }
                                    >
                                        <X aria-hidden="true" />
                                    </Button>
                                </div>
                            ))}
                            <Button
                                type="button"
                                variant="outline"
                                className="self-start"
                                disabled={
                                    form.data.lessons.length >= maxLessons
                                }
                                onClick={() =>
                                    form.setData('lessons', [
                                        ...form.data.lessons,
                                        {
                                            ...(form.data.lessons.at(-1) ??
                                                emptyLesson),
                                            id: null,
                                        },
                                    ])
                                }
                            >
                                <Plus aria-hidden="true" />
                                Aggiungi una lezione
                            </Button>
                            <InputError message={lessonError} />
                        </fieldset>

                        <SwitchRow
                            label="Prenotazione posto"
                            description="I clienti prenotano il posto su MioPersonal, fino ai posti di ogni lezione. Scrivi i posti di ogni lezione."
                            checked={form.data.bookable}
                            onCheckedChange={(checked) =>
                                form.setData('bookable', checked)
                            }
                        />

                        <SwitchRow
                            label="Visibile sul profilo"
                            description="Spegnilo per nascondere il corso senza eliminarlo."
                            checked={form.data.is_active}
                            onCheckedChange={(checked) =>
                                form.setData('is_active', checked)
                            }
                        />
                    </form>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setEditing(null)}
                        >
                            Annulla
                        </Button>
                        <Button
                            type="submit"
                            form="course-form"
                            disabled={
                                form.processing || form.data.name.trim() === ''
                            }
                        >
                            {form.processing && <Spinner />}
                            Salva
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={deleting !== null}
                onOpenChange={(isOpen) => !isOpen && setDeleting(null)}
                title="Eliminare il corso?"
                description={`${deleting?.name ?? ''}: le sue lezioni spariscono dal planner.`}
                confirmLabel="Elimina"
                destructive
                onConfirm={() => {
                    if (deleting) {
                        router.delete(destroy.url(deleting.id), {
                            preserveScroll: true,
                            preserveState: true,
                            onFinish: () => setDeleting(null),
                        });
                    }
                }}
            />
        </>
    );
}

/** The plan of this week and the next: "Annulla" / "Ripristina" a lesson on one day. */
function WeekPlans({ weeks }: { weeks: GymCourseDay[][] }) {
    const [weekIndex, setWeekIndex] = useState(0);
    // Rome day: past lessons can't be called off any more.
    const [today] = useState(() => romeParts(new Date()).date);
    const week = weeks[weekIndex] ?? [];
    // Phones: the day shown; today, or the Monday of another week.
    const [phoneDay, setPhoneDay] = useState<string | null>(null);
    const shownDay = week.some((day) => day.date === phoneDay)
        ? phoneDay
        : (week.find((day) => day.date === today) ?? week[0])?.date;

    const toggle = (lessonId: number, date: string, cancelled: boolean) => {
        const options = { preserveScroll: true, preserveState: true };

        if (cancelled) {
            router.delete(lessons.restore.url(lessonId), {
                ...options,
                data: { date },
            });
        } else {
            router.post(lessons.cancel.url(lessonId), { date }, options);
        }
    };

    return (
        <Panel
            title="Planner"
            action={
                <ChoiceChips
                    aria-label="Settimana"
                    options={[
                        { value: '0', label: 'Questa settimana' },
                        { value: '1', label: 'La prossima' },
                    ]}
                    value={String(weekIndex)}
                    onChange={(value) => setWeekIndex(Number(value))}
                />
            }
        >
            {/* Phones: one day at a time, the days in a row that scrolls. */}
            <div
                role="group"
                aria-label="Giorno"
                className="-mx-1 flex [scrollbar-width:none] gap-1.5 overflow-x-auto px-1 pb-1 md:hidden"
            >
                {week.map((day) => {
                    const active = day.date === shownDay;
                    const count = day.lessons.filter(
                        (lesson) => !lesson.cancelled,
                    ).length;

                    return (
                        <button
                            key={day.date}
                            type="button"
                            aria-pressed={active}
                            onClick={() => setPhoneDay(day.date)}
                            className={cn(
                                'flex min-w-13 shrink-0 flex-col items-center rounded-xl border px-2 py-1.5 text-xs',
                                active
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'bg-background',
                            )}
                        >
                            <span className="font-medium">
                                {day.label.slice(0, 3)}
                            </span>
                            <span className="text-base font-bold tabular-nums">
                                {Number(day.date.slice(8, 10))}
                            </span>
                            <span
                                className={
                                    active
                                        ? 'text-primary-foreground/75'
                                        : 'text-muted-foreground'
                                }
                            >
                                {count === 1 ? '1 lez.' : `${count} lez.`}
                            </span>
                        </button>
                    );
                })}
            </div>
            <div className="flex flex-col gap-4">
                {week.map((day) => (
                    <div
                        key={day.date}
                        className={cn(
                            'flex-col gap-1.5 md:flex',
                            day.date === shownDay ? 'flex' : 'hidden',
                        )}
                    >
                        <h3 className="text-sm font-semibold">
                            {day.label} {Number(day.date.slice(8, 10))}
                        </h3>
                        {day.lessons.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                Nessuna lezione.
                            </p>
                        ) : (
                            <ul className="flex flex-col gap-1.5">
                                {day.lessons.map((lesson) => (
                                    <li
                                        key={lesson.lessonId}
                                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted/60 px-3 py-2 text-sm"
                                    >
                                        <span
                                            className={
                                                lesson.cancelled
                                                    ? 'text-muted-foreground line-through'
                                                    : undefined
                                            }
                                        >
                                            <span className="font-semibold tabular-nums">
                                                {lesson.start}–{lesson.end}
                                            </span>{' '}
                                            {lesson.name}
                                            {lesson.room && ` · ${lesson.room}`}
                                        </span>
                                        {lesson.bookable &&
                                            !lesson.cancelled && (
                                                <Button
                                                    asChild
                                                    size="sm"
                                                    variant="outline"
                                                    className="ml-auto"
                                                >
                                                    <Link
                                                        href={lessons.clients.url(
                                                            lesson.lessonId,
                                                            {
                                                                query: {
                                                                    date: day.date,
                                                                },
                                                            },
                                                        )}
                                                    >
                                                        Iscritti{' '}
                                                        {lesson.registered}/
                                                        {lesson.capacity}
                                                    </Link>
                                                </Button>
                                            )}
                                        {day.date >= today && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant={
                                                    lesson.cancelled
                                                        ? 'secondary'
                                                        : 'ghost'
                                                }
                                                onClick={() =>
                                                    toggle(
                                                        lesson.lessonId,
                                                        day.date,
                                                        lesson.cancelled,
                                                    )
                                                }
                                            >
                                                {lesson.cancelled
                                                    ? 'Ripristina'
                                                    : 'Annulla'}
                                            </Button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                ))}
            </div>
        </Panel>
    );
}

GymCourses.layout = { section: 'courses' };
