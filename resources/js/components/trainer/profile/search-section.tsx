import { Check, MapPin, Plus, Target, Trash2, X } from 'lucide-react';
import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import type {
    PlaceType,
    TrainerDraft,
} from '@/components/onboarding/trainer/draft';
import {
    MAX_DISCIPLINES,
    MAX_GOALS,
    MAX_OTHER_CITIES,
    MAX_STUDIOS,
    needsCity,
} from '@/components/onboarding/trainer/draft';
import StepErrors from '@/components/onboarding/trainer/step-errors';
import NumberedSection from '@/components/trainer/area/numbered-section';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trainingGoals } from '@/lib/goals';
import { cn } from '@/lib/utils';
import type { CatalogOption, CityOption } from '@/types';

/** The places with the labels of the design ("Diventa trainer" keeps its own). */
export const placeLabels: { value: PlaceType; label: string }[] = [
    { value: 'studio', label: 'Studio o palestra' },
    { value: 'home', label: 'A domicilio' },
    { value: 'park', label: 'All’aperto' },
    { value: 'online', label: 'Online' },
];

/** The main city and the others: at most 3 together. */
const MAX_CITIES = 1 + MAX_OTHER_CITIES;

type SearchSectionProps = {
    draft: TrainerDraft;
    update: (changes: Partial<TrainerDraft>) => void;
    /** From the catalog. */
    disciplines: CatalogOption[];
    cities: CityOption[];
    /** Messages from the server for these fields. */
    errors: string[];
};

/**
 * "Discipline, obiettivi, luoghi e città" (section 3 of "Modifica profilo"):
 * what the search reads. The studios' names and addresses show up only with
 * "Studio o palestra".
 */
export default function SearchSection({
    draft,
    update,
    disciplines,
    cities,
    errors,
}: SearchSectionProps) {
    const toggle = <T extends string>(list: T[], value: T, max: number) =>
        list.includes(value)
            ? list.filter((item) => item !== value)
            : list.length < max
              ? [...list, value]
              : list;

    return (
        <NumberedSection
            step={3}
            title="Discipline, obiettivi, luoghi e città"
            className="gap-5.5"
        >
            <StepErrors title="Da sistemare:" errors={errors} />

            <Group
                legend="Discipline"
                note={`${draft.disciplines.length} di ${MAX_DISCIPLINES} al massimo`}
            >
                {disciplines.map((discipline) => {
                    const on = draft.disciplines.includes(discipline.value);

                    return (
                        <Chip
                            key={discipline.value}
                            on={on}
                            disabled={
                                !on &&
                                draft.disciplines.length >= MAX_DISCIPLINES
                            }
                            onClick={() =>
                                update({
                                    disciplines: toggle(
                                        draft.disciplines,
                                        discipline.value,
                                        MAX_DISCIPLINES,
                                    ),
                                })
                            }
                        >
                            {on && <Check strokeWidth={3} />}
                            {discipline.label}
                        </Chip>
                    );
                })}
            </Group>

            <Group
                legend="Obiettivi su cui lavori"
                note={`${draft.goals.length} di ${MAX_GOALS} al massimo`}
            >
                {trainingGoals.map((goal) => {
                    const on = draft.goals.includes(goal.value);

                    return (
                        <Chip
                            key={goal.value}
                            on={on}
                            dashed
                            disabled={!on && draft.goals.length >= MAX_GOALS}
                            onClick={() =>
                                update({
                                    goals: toggle(
                                        draft.goals,
                                        goal.value,
                                        MAX_GOALS,
                                    ),
                                })
                            }
                        >
                            {on ? <Check strokeWidth={3} /> : <Target />}
                            {goal.label}
                        </Chip>
                    );
                })}
            </Group>

            <Places draft={draft} update={update} />

            {needsCity(draft) && (
                <Cities draft={draft} update={update} cities={cities} />
            )}
        </NumberedSection>
    );
}

/** "Dove alleni": four cards, then the studios when "Studio o palestra" is chosen. */
function Places({
    draft,
    update,
}: Pick<SearchSectionProps, 'draft' | 'update'>) {
    const labelId = useId();

    return (
        <div className="flex flex-col gap-2.5">
            <span id={labelId} className="text-sm font-semibold">
                Dove alleni
            </span>
            <div
                role="group"
                aria-labelledby={labelId}
                className="grid grid-cols-2 gap-2.5 sm:grid-cols-4"
            >
                {placeLabels.map((place) => {
                    const on = draft.places.includes(place.value);

                    return (
                        <button
                            key={place.value}
                            type="button"
                            aria-pressed={on}
                            onClick={() =>
                                update({
                                    places: on
                                        ? draft.places.filter(
                                              (item) => item !== place.value,
                                          )
                                        : [...draft.places, place.value],
                                })
                            }
                            className={cn(
                                'flex min-h-19 items-start justify-between gap-2 rounded-2xl border p-3.5 text-left text-[15px] leading-5.5 font-semibold transition-colors',
                                on
                                    ? 'border-foreground bg-foreground text-background'
                                    : 'bg-background hover:bg-muted/50',
                            )}
                        >
                            {place.label}
                            <span
                                aria-hidden="true"
                                className={cn(
                                    'flex size-5 flex-none items-center justify-center rounded-md',
                                    on
                                        ? 'bg-background text-foreground'
                                        : 'border-[1.5px] border-input text-transparent',
                                )}
                            >
                                <Check strokeWidth={3.5} className="size-3" />
                            </span>
                        </button>
                    );
                })}
            </div>

            {draft.places.includes('studio') && (
                <Studios draft={draft} update={update} />
            )}
        </div>
    );
}

/**
 * "Studi e palestre": name and address of each place, at most 3. Also used
 * by step 3 of "Diventa trainer".
 */
export function Studios({
    draft,
    update,
}: Pick<SearchSectionProps, 'draft' | 'update'>) {
    const updateStudio = (
        index: number,
        changes: Partial<TrainerDraft['studios'][number]>,
    ) =>
        update({
            studios: draft.studios.map((studio, i) =>
                i === index ? { ...studio, ...changes } : studio,
            ),
        });

    return (
        <div className="mt-1.5 flex flex-col gap-2.5">
            <span className="text-sm font-semibold tabular-nums">
                Studi e palestre{' '}
                <span className="text-[13px] font-normal text-muted-foreground">
                    · {draft.studios.length} di {MAX_STUDIOS} al massimo
                </span>
            </span>
            {draft.studios.map((studio, index) => (
                <div
                    key={index}
                    className="grid items-center gap-2.5 rounded-[18px] border bg-muted/50 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_40px]"
                >
                    <Input
                        aria-label={`Nome del luogo ${index + 1}`}
                        placeholder="Es. Palestra FitLab"
                        value={studio.name}
                        onChange={(event) =>
                            updateStudio(index, {
                                name: event.target.value,
                            })
                        }
                        className="h-11 rounded-[10px] bg-background font-semibold"
                    />
                    <Input
                        aria-label={`Indirizzo del luogo ${index + 1}`}
                        autoComplete="street-address"
                        placeholder="Via, numero civico, città"
                        value={studio.address}
                        onChange={(event) =>
                            updateStudio(index, {
                                address: event.target.value,
                            })
                        }
                        className="h-11 rounded-[10px] bg-background"
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Rimuovi ${studio.name || 'indirizzo'}`}
                        disabled={draft.studios.length === 1}
                        onClick={() =>
                            update({
                                studios: draft.studios.filter(
                                    (_, i) => i !== index,
                                ),
                            })
                        }
                        className="h-11 w-10 text-muted-foreground"
                    >
                        <Trash2 />
                    </Button>
                </div>
            ))}
            <div className="flex flex-wrap items-center gap-3">
                <Button
                    type="button"
                    variant="outline"
                    disabled={draft.studios.length >= MAX_STUDIOS}
                    onClick={() =>
                        update({
                            studios: [
                                ...draft.studios,
                                { name: '', address: '' },
                            ],
                        })
                    }
                    className="h-10 rounded-[10px] font-semibold"
                >
                    <Plus aria-hidden="true" />
                    Aggiungi indirizzo
                </Button>
                <span className="text-xs text-muted-foreground">
                    Sul profilo mostriamo solo la città. L’indirizzo esatto lo
                    riceve il cliente con la conferma.
                </span>
            </div>
        </div>
    );
}

/**
 * "Città in cui alleni" (also in step 3 of "Diventa trainer"): the first
 * chip is the main city (`city`), the next ones the other cities. Only
 * cities of the catalog, suggested while typing.
 */
export function Cities({
    draft,
    update,
    cities,
}: Pick<SearchSectionProps, 'draft' | 'update' | 'cities'>) {
    const id = useId();
    const [text, setText] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const chosen = [draft.city, ...draft.otherCities].filter(
        (slug) => slug !== '',
    );
    const nameOf = (slug: string) =>
        cities.find((city) => city.value === slug)?.label ?? slug;

    const save = (slugs: string[]) =>
        update({ city: slugs[0] ?? '', otherCities: slugs.slice(1) });

    const add = () => {
        const typed = text.trim().toLowerCase();

        if (typed === '') {
            return;
        }

        const city = cities.find(
            (option) => option.label.toLowerCase() === typed,
        );

        if (!city) {
            setMessage('Scegli una città dall’elenco dei capoluoghi.');

            return;
        }

        if (!chosen.includes(city.value)) {
            save([...chosen, city.value]);
        }

        setText('');
        setMessage(null);
    };

    return (
        <div className="flex flex-col gap-2.5">
            <label htmlFor={id} className="text-sm font-semibold">
                Città in cui alleni
            </label>
            <div className="flex flex-wrap items-center gap-2">
                {chosen.map((slug) => (
                    <span
                        key={slug}
                        className="inline-flex h-9 items-center gap-1 rounded-full bg-foreground pr-1 pl-3.5 text-sm font-medium text-background"
                    >
                        <MapPin
                            aria-hidden="true"
                            className="mr-0.5 size-3.5"
                        />
                        {nameOf(slug)}
                        <button
                            type="button"
                            aria-label={`Rimuovi ${nameOf(slug)}`}
                            onClick={() =>
                                save(chosen.filter((other) => other !== slug))
                            }
                            className="flex size-7 items-center justify-center rounded-full hover:bg-background/15"
                        >
                            <X aria-hidden="true" className="size-3.25" />
                        </button>
                    </span>
                ))}
                {/* At the limit the field goes away: remove a city to add another. */}
                {chosen.length < MAX_CITIES && (
                    <div className="flex h-10 items-center gap-1.5 rounded-full border bg-background pr-1 pl-3 transition-[border-color,box-shadow] focus-within:border-foreground focus-within:ring-3 focus-within:ring-foreground/10">
                        <input
                            id={id}
                            type="text"
                            list={`${id}-options`}
                            aria-describedby={`${id}-hint`}
                            autoComplete="off"
                            placeholder="Aggiungi una città"
                            value={text}
                            onChange={(event) => {
                                setText(event.target.value);
                                setMessage(null);
                            }}
                            onKeyDown={(event) => {
                                // Enter adds the city instead of sending the form.
                                if (event.key === 'Enter') {
                                    event.preventDefault();
                                    add();
                                }
                            }}
                            className="h-full w-37.5 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                        />
                        <datalist id={`${id}-options`}>
                            {cities
                                .filter((city) => !chosen.includes(city.value))
                                .map((city) => (
                                    <option
                                        key={city.value}
                                        value={city.label}
                                    />
                                ))}
                        </datalist>
                        <button
                            type="button"
                            onClick={add}
                            className="h-8 rounded-full bg-secondary px-3 text-[13px] font-semibold hover:bg-accent"
                        >
                            Aggiungi
                        </button>
                    </div>
                )}
            </div>
            {message && (
                <p role="alert" className="text-sm text-destructive">
                    {message}
                </p>
            )}
            <span
                id={`${id}-hint`}
                className="text-[13px] leading-4.5 text-muted-foreground"
            >
                La prima è la tua città principale. Al massimo {MAX_CITIES}.
            </span>
        </div>
    );
}

/** A label with its counter, the chips under it and an optional note. */
export function Group({
    legend,
    note,
    footer,
    children,
}: {
    legend: string;
    note: string;
    footer?: string;
    children: ReactNode;
}) {
    const labelId = useId();

    return (
        <div className="flex flex-col gap-2.5">
            <div className="flex items-baseline justify-between gap-2">
                <span id={labelId} className="text-sm font-semibold">
                    {legend}
                </span>
                <span className="text-[13px] leading-4.5 text-muted-foreground tabular-nums">
                    {note}
                </span>
            </div>
            <div
                role="group"
                aria-labelledby={labelId}
                className="flex flex-wrap gap-2"
            >
                {children}
            </div>
            {footer && (
                <span className="text-[13px] leading-4.5 text-muted-foreground">
                    {footer}
                </span>
            )}
        </div>
    );
}

/** A pill with aria-pressed: black when chosen, dashed for the goals. */
export function Chip({
    on,
    dashed = false,
    disabled,
    onClick,
    children,
}: {
    on: boolean;
    dashed?: boolean;
    disabled: boolean;
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            aria-pressed={on}
            disabled={disabled}
            onClick={onClick}
            className={cn(
                'inline-flex h-10 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors disabled:cursor-default disabled:opacity-40 [&>svg]:size-3.5',
                on
                    ? 'border-foreground bg-foreground text-background'
                    : 'bg-background text-foreground hover:bg-muted/50',
                !on && dashed && 'border-dashed border-ring',
            )}
        >
            {children}
        </button>
    );
}
