import {
    Building2,
    Camera,
    Clock,
    Contact,
    Plus,
    Sparkles,
    Trash2,
    X,
} from 'lucide-react';
import { useEffect, useId, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import InputError from '@/components/input-error';
import type { GymDraft, OpeningRange } from '@/components/onboarding/gym/draft';
import {
    DESCRIPTION_MAX,
    DESCRIPTION_MIN,
    MAX_RANGES_PER_DAY,
    MAX_REGISTRATION_PHOTOS,
    timeOptions,
    weekdays,
} from '@/components/onboarding/gym/draft';
import ChoiceChips from '@/components/shared/choice-chips';
import NumberedSection from '@/components/trainer/area/numbered-section';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { CatalogOption } from '@/types';

type Errors = Partial<Record<string, string>>;

type FieldsProps = {
    draft: GymDraft;
    update: (changes: Partial<GymDraft>) => void;
    errors: Errors;
};

const inputClass = 'h-11 text-base md:text-base';

/** The first error of a field or of its children ("hours.2.0.opens"). */
function errorOf(errors: Errors, field: string): string | undefined {
    return (
        errors[field] ??
        Object.entries(errors).find(([name]) =>
            name.startsWith(`${field}.`),
        )?.[1]
    );
}

function Field({
    label,
    hint,
    error,
    children,
    className,
}: {
    label: string;
    hint?: ReactNode;
    error?: string;
    children: (id: string) => ReactNode;
    className?: string;
}) {
    const id = useId();

    return (
        <div className={cn('flex flex-col gap-1.5', className)}>
            <Label htmlFor={id} className="text-sm font-semibold">
                {label}
            </Label>
            {children(id)}
            {hint && !error && (
                <p className="text-xs text-muted-foreground">{hint}</p>
            )}
            <InputError message={error} />
        </div>
    );
}

/** "La palestra": name, city, address, postal code and description. */
export function GymDetailsFields({
    draft,
    update,
    errors,
    cities,
    step = 1,
}: FieldsProps & { cities: CatalogOption[]; step?: ReactNode }) {
    const length = draft.description.trim().length;

    return (
        <NumberedSection
            step={step}
            title="La palestra"
            description="Come la trovano i clienti nella ricerca."
        >
            <div className="grid gap-4 md:grid-cols-2">
                <Field
                    label="Nome della palestra"
                    error={errors.name}
                    className="md:col-span-2"
                >
                    {(id) => (
                        <Input
                            id={id}
                            value={draft.name}
                            maxLength={120}
                            onChange={(event) =>
                                update({ name: event.target.value })
                            }
                            placeholder="Es. FitLab Milano Centro"
                            className={inputClass}
                        />
                    )}
                </Field>
                <Field label="Città" error={errors.city}>
                    {(id) => (
                        <Select
                            value={draft.city}
                            onValueChange={(city) => update({ city })}
                        >
                            <SelectTrigger
                                id={id}
                                className="h-11 w-full text-base"
                            >
                                <SelectValue placeholder="Scegli la città" />
                            </SelectTrigger>
                            <SelectContent className="max-h-80">
                                {cities.map((city) => (
                                    <SelectItem
                                        key={city.value}
                                        value={city.value}
                                    >
                                        {city.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </Field>
                <Field label="CAP (facoltativo)" error={errors.postal_code}>
                    {(id) => (
                        <Input
                            id={id}
                            inputMode="numeric"
                            maxLength={5}
                            value={draft.postalCode}
                            onChange={(event) =>
                                update({
                                    postalCode: event.target.value.replace(
                                        /\D/g,
                                        '',
                                    ),
                                })
                            }
                            placeholder="20121"
                            className={inputClass}
                        />
                    )}
                </Field>
                <Field
                    label="Indirizzo"
                    error={errors.address}
                    hint="Via e numero civico: serve per “Apri in Google Maps”."
                    className="md:col-span-2"
                >
                    {(id) => (
                        <Input
                            id={id}
                            value={draft.address}
                            maxLength={200}
                            onChange={(event) =>
                                update({ address: event.target.value })
                            }
                            placeholder="Es. Via Roma 12"
                            className={inputClass}
                        />
                    )}
                </Field>
                <Field
                    label="Descrizione"
                    error={errors.description}
                    hint={`${length < DESCRIPTION_MIN ? `Almeno ${DESCRIPTION_MIN} caratteri` : 'Fatto'} · ${draft.description.length}/${DESCRIPTION_MAX}`}
                    className="md:col-span-2"
                >
                    {(id) => (
                        <Textarea
                            id={id}
                            rows={6}
                            maxLength={DESCRIPTION_MAX}
                            value={draft.description}
                            onChange={(event) =>
                                update({ description: event.target.value })
                            }
                            placeholder="Spazi, attrezzature, atmosfera, a chi è adatta. Lascia una riga vuota tra un paragrafo e l’altro."
                            className="text-base md:text-base"
                        />
                    )}
                </Field>
            </div>
        </NumberedSection>
    );
}

/** "Servizi e orari": the amenities, the week and a note. */
export function GymServicesFields({
    draft,
    update,
    errors,
    amenities,
    step = 2,
}: FieldsProps & { amenities: CatalogOption[]; step?: ReactNode }) {
    const amenitiesId = useId();

    return (
        <>
            <NumberedSection
                step={step}
                title="Servizi"
                description="Scegli tutto quello che la palestra offre: i clienti filtrano la ricerca su questi."
            >
                <span id={amenitiesId} className="sr-only">
                    Servizi della palestra
                </span>
                <ChoiceChips
                    multiple
                    aria-labelledby={amenitiesId}
                    options={amenities}
                    value={draft.amenities}
                    onChange={(values) => update({ amenities: values })}
                />
                <InputError message={errorOf(errors, 'amenities')} />
            </NumberedSection>

            <NumberedSection
                step={<Clock aria-hidden="true" />}
                title="Orari di apertura"
                description="Anche più fasce in un giorno, es. 9–13 e 15–21."
            >
                <HoursEditor
                    hours={draft.hours}
                    onChange={(hours) => update({ hours })}
                />
                <InputError message={errorOf(errors, 'hours')} />
                <Field
                    label="Note sugli orari (facoltative)"
                    error={errors.opening_notes}
                >
                    {(id) => (
                        <Input
                            id={id}
                            maxLength={200}
                            value={draft.openingNotes}
                            onChange={(event) =>
                                update({ openingNotes: event.target.value })
                            }
                            placeholder="Es. Chiusa ad agosto, festivi 9–13"
                            className={inputClass}
                        />
                    )}
                </Field>
            </NumberedSection>
        </>
    );
}

function TimeSelect({
    value,
    onChange,
    label,
    from,
}: {
    value: string;
    onChange: (value: string) => void;
    label: string;
    /** Only the times after this one. */
    from?: string;
}) {
    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger
                aria-label={label}
                className="h-10 w-24 tabular-nums"
            >
                <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-72">
                {timeOptions
                    .filter((time) => from === undefined || time > from)
                    .map((time) => (
                        <SelectItem key={time} value={time}>
                            {time}
                        </SelectItem>
                    ))}
            </SelectContent>
        </Select>
    );
}

/** One row per day: closed, or up to 3 ranges; "24 ore" in one click. */
export function HoursEditor({
    hours,
    onChange,
}: {
    hours: OpeningRange[][];
    onChange: (hours: OpeningRange[][]) => void;
}) {
    const setDay = (day: number, ranges: OpeningRange[]) =>
        onChange(
            hours.map((current, index) => (index === day ? ranges : current)),
        );

    const copyMondayToWeekdays = () =>
        onChange(
            hours.map((ranges, index) =>
                index > 0 && index < 5
                    ? hours[0].map((range) => ({ ...range }))
                    : ranges,
            ),
        );

    return (
        <div className="flex flex-col gap-1">
            <ul className="flex flex-col divide-y">
                {hours.map((ranges, day) => (
                    <li
                        key={weekdays[day]}
                        className="flex flex-wrap items-center gap-x-4 gap-y-2 py-2.5"
                    >
                        <span className="w-24 shrink-0 text-[15px] font-semibold">
                            {weekdays[day]}
                        </span>
                        <div className="flex min-w-0 flex-1 flex-col gap-2">
                            {ranges.length === 0 && (
                                <span className="text-sm text-muted-foreground">
                                    Chiusa
                                </span>
                            )}
                            {ranges.map((range, index) => (
                                <div
                                    key={index}
                                    className="flex flex-wrap items-center gap-2"
                                >
                                    <TimeSelect
                                        label={`${weekdays[day]}, apertura ${index + 1}`}
                                        value={range.opens}
                                        onChange={(opens) =>
                                            setDay(
                                                day,
                                                ranges.map((item, i) =>
                                                    i === index
                                                        ? { ...item, opens }
                                                        : item,
                                                ),
                                            )
                                        }
                                    />
                                    <span aria-hidden="true">–</span>
                                    <TimeSelect
                                        label={`${weekdays[day]}, chiusura ${index + 1}`}
                                        value={range.closes}
                                        from={range.opens}
                                        onChange={(closes) =>
                                            setDay(
                                                day,
                                                ranges.map((item, i) =>
                                                    i === index
                                                        ? { ...item, closes }
                                                        : item,
                                                ),
                                            )
                                        }
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        aria-label={`Togli la fascia ${index + 1} di ${weekdays[day]}`}
                                        onClick={() =>
                                            setDay(
                                                day,
                                                ranges.filter(
                                                    (_, i) => i !== index,
                                                ),
                                            )
                                        }
                                        className="size-9"
                                    >
                                        <X aria-hidden="true" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-1.5">
                            {ranges.length < MAX_RANGES_PER_DAY && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-9 px-3 text-sm"
                                    onClick={() => {
                                        const last = ranges.at(-1)?.closes;
                                        const opens =
                                            last && last < '23:00'
                                                ? last
                                                : '09:00';

                                        setDay(day, [
                                            ...ranges,
                                            {
                                                opens,
                                                closes: timeOptions[
                                                    Math.min(
                                                        timeOptions.indexOf(
                                                            opens,
                                                        ) + 8,
                                                        timeOptions.length - 1,
                                                    )
                                                ],
                                            },
                                        ]);
                                    }}
                                >
                                    <Plus aria-hidden="true" />
                                    Fascia
                                </Button>
                            )}
                            <Button
                                type="button"
                                variant="ghost"
                                className="h-9 px-3 text-sm"
                                onClick={() =>
                                    setDay(day, [
                                        { opens: '00:00', closes: '24:00' },
                                    ])
                                }
                            >
                                24 ore
                            </Button>
                        </div>
                    </li>
                ))}
            </ul>
            <Button
                type="button"
                variant="ghost"
                className="h-9 self-start px-2 text-sm underline"
                onClick={copyMondayToWeekdays}
            >
                Copia gli orari del lunedì fino a venerdì
            </Button>
        </div>
    );
}

/** A local preview of a chosen file. */
function useObjectUrls(files: File[]): string[] {
    const [urls, setUrls] = useState<string[]>([]);

    useEffect(() => {
        const created = files.map((file) => URL.createObjectURL(file));
        setUrls(created);

        return () => created.forEach((url) => URL.revokeObjectURL(url));
    }, [files]);

    return urls;
}

/** "Foto": the cover (required) and, at the registration, the first gallery photos. */
export function GymPhotosFields({
    draft,
    update,
    errors,
    withGallery,
    step = 3,
}: FieldsProps & { withGallery: boolean; step?: ReactNode }) {
    const coverInput = useId();
    const galleryInput = useId();
    const coverFiles = useMemo(
        () => (draft.cover ? [draft.cover] : []),
        [draft.cover],
    );
    const [coverPreview] = useObjectUrls(coverFiles);
    const galleryPreviews = useObjectUrls(draft.gallery);
    const cover = coverPreview ?? draft.coverUrl;

    return (
        <NumberedSection
            step={step}
            title="Foto"
            description="JPG o PNG, almeno 800 × 500 px, massimo 5 MB ciascuna."
        >
            <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold">Copertina</span>
                <label
                    htmlFor={coverInput}
                    className={cn(
                        'relative flex aspect-[16/7] cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed bg-muted/50 hover:bg-muted',
                        cover && 'border-solid',
                    )}
                >
                    {cover ? (
                        <img
                            src={cover}
                            alt="Copertina scelta"
                            className="size-full object-cover"
                        />
                    ) : (
                        <span className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                            <Camera aria-hidden="true" className="size-6" />
                            Scegli la foto di copertina
                        </span>
                    )}
                </label>
                <input
                    id={coverInput}
                    type="file"
                    accept="image/jpeg,image/png"
                    className="sr-only"
                    onChange={(event) => {
                        const file = event.target.files?.[0];

                        if (file) {
                            update({ cover: file });
                        }

                        event.target.value = '';
                    }}
                />
                <InputError message={errors.cover} />
            </div>

            {withGallery && (
                <div className="flex flex-col gap-2">
                    <span className="text-sm font-semibold">
                        Altre foto (facoltative, fino a{' '}
                        {MAX_REGISTRATION_PHOTOS})
                    </span>
                    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {galleryPreviews.map((url, index) => (
                            <li
                                key={url}
                                className="relative aspect-4/3 overflow-hidden rounded-xl"
                            >
                                <img
                                    src={url}
                                    alt={`Foto ${index + 1}`}
                                    className="size-full object-cover"
                                />
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="secondary"
                                    aria-label={`Togli la foto ${index + 1}`}
                                    onClick={() =>
                                        update({
                                            gallery: draft.gallery.filter(
                                                (_, i) => i !== index,
                                            ),
                                        })
                                    }
                                    className="absolute top-1.5 right-1.5 size-8 rounded-full"
                                >
                                    <Trash2 aria-hidden="true" />
                                </Button>
                            </li>
                        ))}
                        {draft.gallery.length < MAX_REGISTRATION_PHOTOS && (
                            <li>
                                <label
                                    htmlFor={galleryInput}
                                    className="flex aspect-4/3 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed text-xs text-muted-foreground hover:bg-muted"
                                >
                                    <Plus
                                        aria-hidden="true"
                                        className="size-5"
                                    />
                                    Aggiungi
                                </label>
                                <input
                                    id={galleryInput}
                                    type="file"
                                    multiple
                                    accept="image/jpeg,image/png"
                                    className="sr-only"
                                    onChange={(event) => {
                                        const files = Array.from(
                                            event.target.files ?? [],
                                        );
                                        update({
                                            gallery: [
                                                ...draft.gallery,
                                                ...files,
                                            ].slice(0, MAX_REGISTRATION_PHOTOS),
                                        });
                                        event.target.value = '';
                                    }}
                                />
                            </li>
                        )}
                    </ul>
                    <InputError message={errorOf(errors, 'gallery')} />
                </div>
            )}
        </NumberedSection>
    );
}

/** "Contatti": public on the profile, all optional. */
export function GymContactsFields({
    draft,
    update,
    errors,
    step = <Contact aria-hidden="true" />,
}: FieldsProps & { step?: ReactNode }) {
    return (
        <NumberedSection
            step={step}
            title="Contatti pubblici"
            description="Compaiono nel profilo della palestra. Tutti facoltativi."
            optional
        >
            <div className="grid gap-4 md:grid-cols-2">
                <Field label="Telefono" error={errors.contact_phone}>
                    {(id) => (
                        <Input
                            id={id}
                            type="tel"
                            value={draft.contactPhone}
                            onChange={(event) =>
                                update({ contactPhone: event.target.value })
                            }
                            placeholder="02 1234567"
                            className={inputClass}
                        />
                    )}
                </Field>
                <Field label="Email" error={errors.contact_email}>
                    {(id) => (
                        <Input
                            id={id}
                            type="email"
                            value={draft.contactEmail}
                            onChange={(event) =>
                                update({ contactEmail: event.target.value })
                            }
                            placeholder="info@fitlab.it"
                            className={inputClass}
                        />
                    )}
                </Field>
                <Field label="Sito web" error={errors.website}>
                    {(id) => (
                        <Input
                            id={id}
                            value={draft.website}
                            onChange={(event) =>
                                update({ website: event.target.value })
                            }
                            placeholder="www.fitlab.it"
                            className={inputClass}
                        />
                    )}
                </Field>
                <Field label="Instagram" error={errors.instagram}>
                    {(id) => (
                        <Input
                            id={id}
                            value={draft.instagram}
                            onChange={(event) =>
                                update({ instagram: event.target.value })
                            }
                            placeholder="@fitlab.milano"
                            className={inputClass}
                        />
                    )}
                </Field>
            </div>
        </NumberedSection>
    );
}

export const gymStepIcons = {
    details: <Building2 aria-hidden="true" />,
    services: <Sparkles aria-hidden="true" />,
};
