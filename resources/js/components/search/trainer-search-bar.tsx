import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
    Check,
    ChevronDown,
    Dumbbell,
    MapPin,
    Navigation,
    Search,
    Target,
    Video,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import CategoryNav from '@/components/mp/category-nav';
import { Spinner } from '@/components/ui/spinner';
import { useLocateCity } from '@/hooks/use-locate-city';
import { trainingGoals } from '@/lib/goals';
import type { TrainingGoal } from '@/lib/goals';
import type { SearchOption } from '@/lib/search';
import { cn } from '@/lib/utils';
import type { CityWithCoordinates } from '@/types';

/** What the search panel sets: the "Cosa", the "Dove" and the "Modalità". */
export type SearchDraft = {
    disciplina: string[];
    obiettivo: TrainingGoal[];
    /** Words of the trainer's name. */
    nome: string | null;
    city: { slug: string; name: string } | null;
    modalita: 'presenza' | 'online' | null;
};

export const emptyDraft: SearchDraft = {
    disciplina: [],
    obiettivo: [],
    nome: null,
    city: null,
    modalita: null,
};

type Section = 'cosa' | 'dove' | 'modalita';

type TrainerSearchBarProps = {
    /** The search in the address bar. */
    value: SearchDraft;
    disciplines: SearchOption[];
    cities: CityWithCoordinates[];
    onSearch: (draft: SearchDraft) => void;
    /** Phones: the round "Filtri" button next to the pill. */
    filters: ReactNode;
};

const toggle = <T,>(list: T[], item: T): T[] =>
    list.includes(item) ? list.filter((x) => x !== item) : [...list, item];

const modeLabel = (mode: SearchDraft['modalita']) =>
    mode === 'presenza'
        ? 'Dal vivo'
        : mode === 'online'
          ? 'Online'
          : 'Dal vivo o online';

/** "Dal vivo" and "Online" ticked → the filter (both or none = any). */
function modeOf(live: boolean, online: boolean): SearchDraft['modalita'] {
    if (live === online) {
        return null;
    }

    return live ? 'presenza' : 'online';
}

/** Matches "cali" in "Calisthenics", without accents or case. */
const normalize = (text: string) =>
    text
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .trim();

/** The search state shared by the phone panel and the desktop bar. */
function useDraft(
    value: SearchDraft,
    disciplines: SearchOption[],
    cities: CityWithCoordinates[],
) {
    const [draft, setDraft] = useState(value);
    // What is written in "Cosa": resolved on "Cerca" (see `final`).
    const [text, setText] = useState(value.nome ?? '');
    const update = (changes: Partial<SearchDraft>) =>
        setDraft((current) => ({ ...current, ...changes }));
    const located = useLocateCity(cities, (city) =>
        update({ city: { slug: city.value, name: city.label } }),
    );

    /**
     * The search to send: a discipline or a goal written in full is chosen
     * as such, any other words are searched in the trainers' names.
     */
    const final = ((): SearchDraft => {
        const words = text.trim();
        const name = normalize(words);
        const discipline = disciplines.find(
            (option) => normalize(option.label) === name,
        );
        const goal = trainingGoals.find(
            (option) => normalize(option.label) === name,
        );

        if (words === '') {
            return { ...draft, nome: null };
        }

        if (discipline) {
            return {
                ...draft,
                nome: null,
                disciplina: [
                    ...new Set([...draft.disciplina, discipline.value]),
                ],
            };
        }

        if (goal) {
            return {
                ...draft,
                nome: null,
                obiettivo: [...new Set([...draft.obiettivo, goal.value])],
            };
        }

        return { ...draft, nome: words };
    })();

    /** A suggestion picked: the words were only there to find it. */
    const pick = (changes: Partial<SearchDraft>) => {
        update(changes);
        setText('');
    };

    const clear = () => {
        setDraft(emptyDraft);
        setText('');
    };

    const whatLabels = [
        ...final.disciplina.map(
            (slug) =>
                disciplines.find((option) => option.value === slug)?.label ??
                slug,
        ),
        ...final.obiettivo.map(
            (goal) =>
                trainingGoals.find((option) => option.value === goal)?.label ??
                goal,
        ),
        ...(final.nome ? [`«${final.nome}»`] : []),
    ];

    return {
        draft,
        update,
        pick,
        clear,
        text,
        setText,
        final,
        located,
        whatLabels,
    };
}

type Draft = ReturnType<typeof useDraft>;

/**
 * The search of the trainers (designs "Ricerca A" and "Ricerca desktop").
 * Phones: the pill "Inizia la ricerca", "Filtri" and the categories (when
 * more than the trainers are on); the
 * pill opens the panel "Cosa? · Dove · Modalità" on the whole screen.
 * Desktop: the round bar "Cosa · Dove · Modalità · Cerca", each part opens
 * its panel underneath.
 */
export default function TrainerSearchBar(props: TrainerSearchBarProps) {
    return (
        <>
            <MobileSearch {...props} />
            <DesktopSearch {...props} />
        </>
    );
}

/* ------------------------------------------------------------------ */
/* Phones                                                              */
/* ------------------------------------------------------------------ */

function MobileSearch({
    value,
    disciplines,
    cities,
    onSearch,
    filters,
}: TrainerSearchBarProps) {
    const [open, setOpen] = useState(false);
    const summary = [
        ...useDraft(value, disciplines, cities).whatLabels,
        ...(value.city ? [value.city.name] : []),
    ].join(' · ');

    return (
        <div className="flex flex-col pt-16 md:hidden">
            <div className="mx-4 mt-3.5 flex items-center gap-2.5">
                <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
                    <DialogPrimitive.Trigger className="flex h-14 min-w-0 flex-1 items-center justify-center gap-2.5 rounded-full border border-border bg-card px-5 text-[17px] font-semibold text-foreground shadow-[inset_0_1px_0_0_rgba(237,238,240,0.06),0_8px_24px_0_rgba(0,0,0,0.4)] outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        <Search
                            aria-hidden="true"
                            className="size-5 shrink-0 text-brand"
                            strokeWidth={2.2}
                        />
                        <span className="truncate">
                            {summary || 'Inizia la ricerca'}
                        </span>
                    </DialogPrimitive.Trigger>
                    <DialogPrimitive.Portal>
                        <MobilePanel
                            // Opened again: from the search in the address bar.
                            key={String(open)}
                            value={value}
                            disciplines={disciplines}
                            cities={cities}
                            onSearch={(draft) => {
                                setOpen(false);
                                onSearch(draft);
                            }}
                        />
                    </DialogPrimitive.Portal>
                </DialogPrimitive.Root>
                {filters}
            </div>
            <CategoryNav
                current="trainer"
                city={value.city?.slug ?? null}
                className="mx-2 mt-4.5 border-b border-separator"
            />
        </div>
    );
}

function MobilePanel({
    value,
    disciplines,
    cities,
    onSearch,
}: Omit<TrainerSearchBarProps, 'filters'>) {
    const state = useDraft(value, disciplines, cities);
    const { draft } = state;
    const [section, setSection] = useState<Section>('cosa');

    return (
        <DialogPrimitive.Content
            aria-describedby={undefined}
            className="theme-dark fixed inset-0 z-50 flex flex-col overflow-y-auto overscroll-contain bg-background pb-30 text-foreground outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-4"
        >
            <DialogPrimitive.Title className="sr-only">
                Cerca un personal trainer
            </DialogPrimitive.Title>
            <div className="flex items-start pt-5 pr-3 pl-2">
                <CategoryNav
                    current="trainer"
                    city={draft.city?.slug ?? null}
                    className="flex-1"
                />
                <DialogPrimitive.Close
                    aria-label="Chiudi"
                    className="ml-auto flex size-11 shrink-0 items-center justify-center rounded-full border border-white/12 bg-card text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <X aria-hidden="true" className="size-5" />
                </DialogPrimitive.Close>
            </div>

            {section === 'cosa' ? (
                <PanelCard title="Cosa?">
                    <MobileWhat state={state} disciplines={disciplines} />
                </PanelCard>
            ) : (
                <SectionRow
                    label="Cosa"
                    value={state.whatLabels.join(', ') || 'Tutto'}
                    onClick={() => setSection('cosa')}
                />
            )}

            {section === 'dove' ? (
                <PanelCard title="Dove?">
                    <WhereContent state={state} cities={cities} />
                </PanelCard>
            ) : (
                <SectionRow
                    label="Dove"
                    value={draft.city?.name ?? 'Aggiungi zona'}
                    onClick={() => setSection('dove')}
                />
            )}

            {section === 'modalita' ? (
                <PanelCard title="Come vuoi allenarti?">
                    <ModeContent state={state} />
                </PanelCard>
            ) : (
                <SectionRow
                    label="Modalità"
                    value={modeLabel(draft.modalita)}
                    onClick={() => setSection('modalita')}
                />
            )}

            <div className="fixed inset-x-0 bottom-0 flex h-26 items-center justify-between border-t border-separator bg-glass px-4 pb-6 pl-6 backdrop-blur-xl backdrop-saturate-[1.8]">
                <button
                    type="button"
                    onClick={state.clear}
                    className="h-11 text-[17px] font-semibold text-foreground underline outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    Cancella tutto
                </button>
                <SubmitButton onClick={() => onSearch(state.final)} />
            </div>
        </DialogPrimitive.Content>
    );
}

function PanelCard({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <section className="mx-3 mt-4.5 rounded-[32px] border border-separator bg-card px-5 pt-6 pb-3 shadow-[inset_0_1px_0_0_rgba(237,238,240,0.06),0_20px_40px_0_rgba(0,0,0,0.5)]">
            <h2 className="mb-4 text-[28px] leading-[1.15] font-bold tracking-[-0.03em]">
                {title}
            </h2>
            {children}
        </section>
    );
}

function SectionRow({
    label,
    value,
    onClick,
}: {
    label: string;
    value: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="mx-3 mt-2.5 flex h-16 items-center justify-between gap-4 rounded-[22px] border border-separator bg-card px-5 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
            <span className="text-muted-foreground">{label}</span>
            <span className="truncate font-semibold">{value}</span>
        </button>
    );
}

/** "Cerca": the one filled turquoise button of the panel. */
function SubmitButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="inline-flex h-14 shrink-0 items-center gap-2.5 rounded-full bg-brand px-7 text-lg font-semibold text-black shadow-[0_0_28px_rgba(66,215,217,0.3)] outline-none hover:brightness-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
            <Search aria-hidden="true" className="size-5" strokeWidth={2.2} />
            Cerca
        </button>
    );
}

/** A row of the suggestions: the icon in a box, the name and what it is. */
function SuggestionRow({
    icon,
    title,
    subtitle,
    selected = false,
    brand = false,
    onClick,
    trailing,
}: {
    icon: ReactNode;
    title: string;
    subtitle: string;
    selected?: boolean;
    brand?: boolean;
    onClick: () => void;
    trailing?: ReactNode;
}) {
    return (
        <button
            type="button"
            aria-pressed={selected}
            onClick={onClick}
            className="flex w-full items-center gap-4 rounded-2xl py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
            <span
                className={cn(
                    'flex size-14 shrink-0 items-center justify-center rounded-2xl md:size-12 md:rounded-[14px]',
                    brand || selected
                        ? 'bg-brand-soft text-brand'
                        : 'bg-secondary text-foreground',
                )}
            >
                {icon}
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-[17px] font-semibold md:text-base">
                    {title}
                </span>
                <span className="truncate text-[15px] text-muted-foreground md:text-sm">
                    {subtitle}
                </span>
            </span>
            {trailing ??
                (selected && (
                    <Check
                        aria-hidden="true"
                        className="size-5 shrink-0 text-brand"
                    />
                ))}
        </button>
    );
}

/** The field of "Cosa": a discipline, a goal or a trainer's name. */
function WhatField({
    text,
    onTextChange,
}: {
    text: string;
    onTextChange: (text: string) => void;
}) {
    return (
        <label className="flex h-13.5 items-center gap-3 rounded-2xl border border-white/22 bg-background px-4.5 focus-within:border-brand">
            <Search aria-hidden="true" className="size-5 shrink-0" />
            <input
                type="search"
                aria-label="Cerca disciplina, trainer o obiettivo"
                placeholder="Disciplina, trainer, obiettivo"
                value={text}
                onChange={(event) => onTextChange(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-[17px] text-foreground outline-none placeholder:text-muted-foreground"
            />
        </label>
    );
}

/** The options of "Cosa" that contain the text (all of them when empty). */
function whatMatches(text: string, disciplines: SearchOption[]) {
    const query = normalize(text);
    const match = (label: string) =>
        query === '' || normalize(label).includes(query);

    return {
        disciplines: disciplines.filter((option) => match(option.label)),
        goals: trainingGoals.filter((option) => match(option.label)),
    };
}

function MobileWhat({
    state,
    disciplines,
}: {
    state: Draft;
    disciplines: SearchOption[];
}) {
    const { draft, pick, located, text, setText } = state;
    const [more, setMore] = useState(false);
    const matches = whatMatches(text, disciplines);
    const typing = text.trim() !== '';
    const rows = [
        ...matches.disciplines.map((option) => ({
            key: `d:${option.value}`,
            title: option.label,
            subtitle: 'Disciplina',
            icon: <Dumbbell aria-hidden="true" className="size-6" />,
            selected: draft.disciplina.includes(option.value),
            pick: () =>
                pick({ disciplina: toggle(draft.disciplina, option.value) }),
        })),
        ...matches.goals.map((option) => ({
            key: `g:${option.value}`,
            title: option.label,
            subtitle: 'Obiettivo',
            icon: <Target aria-hidden="true" className="size-6" />,
            selected: draft.obiettivo.includes(option.value),
            pick: () =>
                pick({ obiettivo: toggle(draft.obiettivo, option.value) }),
        })),
    ];
    // At first a few: the chosen ones, then the others.
    const sorted = [...rows].sort(
        (a, b) => Number(b.selected) - Number(a.selected),
    );
    const chosen = rows.filter((row) => row.selected);
    // Closed: the chosen ones, or a discipline and a goal to start from.
    const firstOfEach = [
        rows.find((row) => row.key.startsWith('d:')),
        rows.find((row) => row.key.startsWith('g:')),
    ].filter((row) => row !== undefined);
    const shown =
        typing || more ? sorted : chosen.length > 0 ? chosen : firstOfEach;

    return (
        <>
            <WhatField text={text} onTextChange={setText} />
            <p className="mt-4.5 mb-1.5 text-[15px] text-muted-foreground">
                Suggerimenti
            </p>
            {!typing && (
                <SuggestionRow
                    brand
                    icon={
                        located.locating ? (
                            <Spinner className="size-6" />
                        ) : (
                            <Navigation aria-hidden="true" className="size-6" />
                        )
                    }
                    title="Trainer nelle vicinanze"
                    subtitle={
                        draft.city
                            ? `Vicino a ${draft.city.name}`
                            : 'Scopri chi si allena intorno a te'
                    }
                    onClick={located.locate}
                    trailing={null}
                />
            )}
            {located.error && (
                <p role="alert" className="py-1 text-sm text-destructive">
                    {located.error}
                </p>
            )}
            {shown.map((row) => (
                <SuggestionRow
                    key={row.key}
                    icon={row.icon}
                    title={row.title}
                    subtitle={row.subtitle}
                    selected={row.selected}
                    onClick={row.pick}
                />
            ))}
            {typing && rows.length === 0 && (
                <p className="py-2 text-[15px] text-muted-foreground">
                    Con «Cerca» trovi i trainer con questo nome.
                </p>
            )}
            {!typing && (
                <>
                    <div className="mt-2 h-px bg-separator" />
                    <button
                        type="button"
                        aria-expanded={more}
                        aria-label={
                            more
                                ? 'Mostra meno suggerimenti'
                                : 'Mostra altri suggerimenti'
                        }
                        onClick={() => setMore(!more)}
                        className="flex h-11 w-full items-center justify-center text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <ChevronDown
                            aria-hidden="true"
                            className={cn('size-5', more && 'rotate-180')}
                        />
                    </button>
                </>
            )}
        </>
    );
}

/** "Dove": the city, or the closest one to the position. */
function WhereContent({
    state,
    cities,
}: {
    state: Draft;
    cities: CityWithCoordinates[];
}) {
    const { draft, update, located } = state;
    const [text, setText] = useState('');
    const query = normalize(text);
    const matches =
        query === ''
            ? []
            : cities
                  .filter((city) => normalize(city.label).startsWith(query))
                  .concat(
                      cities.filter(
                          (city) =>
                              !normalize(city.label).startsWith(query) &&
                              normalize(
                                  `${city.label} ${city.region}`,
                              ).includes(query),
                      ),
                  )
                  .slice(0, 6);

    return (
        <div className="flex flex-col">
            <label className="flex h-13 items-center gap-3 rounded-2xl border border-white/20 bg-surface-sunken px-4 focus-within:border-brand">
                <MapPin
                    aria-hidden="true"
                    className="size-5 shrink-0 text-muted-foreground"
                />
                <input
                    type="text"
                    autoComplete="address-level2"
                    aria-label="Città o zona"
                    placeholder="Città o regione"
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-[17px] text-foreground outline-none placeholder:text-muted-foreground"
                />
            </label>
            <div className="mt-3 flex flex-col">
                <SuggestionRow
                    brand
                    icon={
                        located.locating ? (
                            <Spinner className="size-5.5" />
                        ) : (
                            <Navigation
                                aria-hidden="true"
                                className="size-5.5"
                            />
                        )
                    }
                    title="Nelle vicinanze"
                    subtitle="Usa la tua posizione"
                    onClick={located.locate}
                    trailing={null}
                />
                {located.error && (
                    <p role="alert" className="py-1 text-sm text-destructive">
                        {located.error}
                    </p>
                )}
                {draft.city && query === '' && (
                    <SuggestionRow
                        selected
                        icon={
                            <MapPin aria-hidden="true" className="size-5.5" />
                        }
                        title={draft.city.name}
                        subtitle="Tocca per cercare in tutta Italia"
                        onClick={() => update({ city: null })}
                    />
                )}
                {matches.map((city) => (
                    <SuggestionRow
                        key={city.value}
                        selected={draft.city?.slug === city.value}
                        icon={
                            <MapPin aria-hidden="true" className="size-5.5" />
                        }
                        title={city.label}
                        subtitle={city.region}
                        onClick={() => {
                            update({
                                city: { slug: city.value, name: city.label },
                            });
                            setText('');
                        }}
                    />
                ))}
                {query !== '' && matches.length === 0 && (
                    <p className="py-2 text-[15px] text-muted-foreground">
                        Nessuna città con questo nome.
                    </p>
                )}
            </div>
        </div>
    );
}

/** "Come vuoi allenarti": dal vivo, online, or both. */
function ModeContent({ state }: { state: Draft }) {
    const { draft, update } = state;
    const live = draft.modalita !== 'online';
    const online = draft.modalita !== 'presenza';
    // Nothing chosen = both: shown as both ticked.
    const options = [
        {
            label: 'Dal vivo',
            checked: live,
            set: (on: boolean) => update({ modalita: modeOf(on, online) }),
        },
        {
            label: 'Online',
            checked: online,
            set: (on: boolean) => update({ modalita: modeOf(live, on) }),
        },
    ];

    return (
        <div className="flex flex-col gap-2.5 pb-3">
            {options.map((option) => (
                <label
                    key={option.label}
                    className="flex min-h-13 cursor-pointer items-center gap-3 rounded-2xl bg-surface-sunken px-4 text-base"
                >
                    <input
                        type="checkbox"
                        checked={option.checked}
                        onChange={(event) => option.set(event.target.checked)}
                        className="size-5 accent-brand"
                    />
                    {option.label}
                </label>
            ))}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Desktop                                                             */
/* ------------------------------------------------------------------ */

function DesktopSearch({
    value,
    disciplines,
    cities,
    onSearch,
}: TrainerSearchBarProps) {
    const state = useDraft(value, disciplines, cities);
    const { draft } = state;
    const [open, setOpen] = useState<Section | null>(null);
    const ref = useRef<HTMLDivElement>(null);

    // A click outside or Esc closes the panel.
    useEffect(() => {
        if (!open) {
            return;
        }

        const onPointer = (event: PointerEvent) => {
            if (!ref.current?.contains(event.target as Node)) {
                setOpen(null);
            }
        };
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpen(null);
            }
        };
        document.addEventListener('pointerdown', onPointer);
        document.addEventListener('keydown', onKey);

        return () => {
            document.removeEventListener('pointerdown', onPointer);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    const segments: {
        id: Section;
        label: string;
        value: string;
        empty: boolean;
    }[] = [
        {
            id: 'cosa',
            label: 'Cosa',
            value:
                state.whatLabels.join(', ') || 'Disciplina, trainer, obiettivo',
            empty: state.whatLabels.length === 0,
        },
        {
            id: 'dove',
            label: 'Dove',
            value: draft.city?.name ?? 'Città, regione',
            empty: draft.city === null,
        },
        {
            id: 'modalita',
            label: 'Modalità',
            value: modeLabel(draft.modalita),
            empty: draft.modalita === null,
        },
    ];

    return (
        <div className="hidden border-b border-separator pt-22 md:block">
            <div
                ref={ref}
                role="search"
                className="relative z-10 mx-auto mt-5 mb-5.5 max-w-225 px-8"
            >
                <div className="flex items-center rounded-full border border-border bg-card p-1.5 shadow-[inset_0_1px_0_0_rgba(237,238,240,0.06),0_16px_40px_rgba(0,0,0,0.5)]">
                    {segments.map((segment) => (
                        <button
                            key={segment.id}
                            type="button"
                            aria-expanded={open === segment.id}
                            onClick={() =>
                                setOpen(open === segment.id ? null : segment.id)
                            }
                            className={cn(
                                'flex h-15 min-w-0 flex-1 flex-col justify-center gap-0.5 rounded-full px-5.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                open === segment.id
                                    ? 'bg-secondary shadow-[0_6px_18px_rgba(0,0,0,0.4)]'
                                    : 'hover:bg-secondary/60',
                            )}
                        >
                            <span className="text-xs font-bold tracking-[0.08em] uppercase">
                                {segment.label}
                            </span>
                            <span
                                className={cn(
                                    'truncate text-[15px]',
                                    segment.empty && open !== segment.id
                                        ? 'text-muted-foreground'
                                        : 'text-foreground',
                                )}
                            >
                                {segment.value}
                            </span>
                        </button>
                    ))}
                    <SubmitButton
                        onClick={() => {
                            setOpen(null);
                            onSearch(state.final);
                        }}
                    />
                </div>

                {open === 'cosa' && (
                    <DesktopPanel className="inset-x-8 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-7 p-7">
                        <DesktopWhat state={state} disciplines={disciplines} />
                    </DesktopPanel>
                )}
                {open === 'dove' && (
                    <DesktopPanel className="left-8 w-110 p-6">
                        <WhereContent state={state} cities={cities} />
                    </DesktopPanel>
                )}
                {open === 'modalita' && (
                    <DesktopPanel className="right-8 w-110 p-6">
                        <p className={eyebrow}>Come vuoi allenarti</p>
                        <ModeContent state={state} />
                    </DesktopPanel>
                )}
            </div>
        </div>
    );
}

const eyebrow =
    'mb-2.5 text-[13px] font-bold tracking-[0.06em] text-muted-foreground uppercase';

function DesktopPanel({
    className,
    children,
}: {
    className?: string;
    children: ReactNode;
}) {
    return (
        <div
            className={cn(
                'absolute top-[calc(100%+12px)] rounded-[32px] border border-border bg-card shadow-[0_30px_80px_rgba(0,0,0,0.7)]',
                className,
            )}
        >
            {children}
        </div>
    );
}

/** An outlined chip of the desktop panel, turquoise when chosen. */
function Chip({
    label,
    pressed,
    onClick,
}: {
    label: string;
    pressed: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            aria-pressed={pressed}
            onClick={onClick}
            className={cn(
                'h-9.5 rounded-full border px-3.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring',
                pressed
                    ? 'border-brand bg-brand/16 font-semibold text-brand'
                    : 'border-white/14 bg-surface-sunken text-foreground hover:border-white/30',
            )}
        >
            {label}
        </button>
    );
}

function DesktopWhat({
    state,
    disciplines,
}: {
    state: Draft;
    disciplines: SearchOption[];
}) {
    const { draft, update, pick, located, text, setText } = state;
    const matches = whatMatches(text, disciplines);

    return (
        <>
            <div>
                <p className={eyebrow}>Suggerimenti</p>
                <WhatField text={text} onTextChange={setText} />
                <div className="mt-2 flex flex-col">
                    <SuggestionRow
                        brand
                        icon={
                            located.locating ? (
                                <Spinner className="size-5.5" />
                            ) : (
                                <Navigation
                                    aria-hidden="true"
                                    className="size-5.5"
                                />
                            )
                        }
                        title="Trainer nelle vicinanze"
                        subtitle={
                            draft.city
                                ? `Vicino a ${draft.city.name}`
                                : 'Intorno a te'
                        }
                        onClick={located.locate}
                        trailing={null}
                    />
                    {located.error && (
                        <p
                            role="alert"
                            className="py-1 text-sm text-destructive"
                        >
                            {located.error}
                        </p>
                    )}
                    <SuggestionRow
                        icon={<Video aria-hidden="true" className="size-5.5" />}
                        title="Coaching online"
                        subtitle="Allenati da casa"
                        selected={draft.modalita === 'online'}
                        onClick={() =>
                            update({
                                modalita:
                                    draft.modalita === 'online'
                                        ? null
                                        : 'online',
                            })
                        }
                    />
                </div>
            </div>
            <div>
                <p className={eyebrow}>Discipline</p>
                <div className="flex flex-wrap gap-2">
                    {matches.disciplines.map((option) => (
                        <Chip
                            key={option.value}
                            label={option.label}
                            pressed={draft.disciplina.includes(option.value)}
                            onClick={() =>
                                pick({
                                    disciplina: toggle(
                                        draft.disciplina,
                                        option.value,
                                    ),
                                })
                            }
                        />
                    ))}
                </div>
            </div>
            <div>
                <p className={eyebrow}>Obiettivi</p>
                <div className="flex flex-wrap gap-2">
                    {matches.goals.map((option) => (
                        <Chip
                            key={option.value}
                            label={option.label}
                            pressed={draft.obiettivo.includes(option.value)}
                            onClick={() =>
                                pick({
                                    obiettivo: toggle(
                                        draft.obiettivo,
                                        option.value,
                                    ),
                                })
                            }
                        />
                    ))}
                </div>
            </div>
        </>
    );
}
