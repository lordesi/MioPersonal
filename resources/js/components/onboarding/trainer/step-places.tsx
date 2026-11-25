import {
    Building2,
    DoorOpen,
    House,
    MapPin,
    Plus,
    Trees,
    Video,
    X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import ComboField from '@/components/mp/combo-field';
import {
    Optional,
    pillBoxClassName,
    pillInnerClassName,
    Section,
} from '@/components/onboarding/dark-fields';
import {
    AddButton,
    ChipRow,
    Counter,
    DarkCard,
    DeleteButton,
} from '@/components/onboarding/trainer/dark-bits';
import type {
    PlaceType,
    TrainerDraft,
} from '@/components/onboarding/trainer/draft';
import {
    MAX_DISCIPLINES,
    MAX_GOALS,
    MAX_GYMS,
    MAX_OTHER_CITIES,
    MAX_STUDIOS,
    needsCity,
    placeOptions,
} from '@/components/onboarding/trainer/draft';
import OptionsMenu from '@/components/search/options-menu';
import type { GymOption } from '@/components/onboarding/trainer/draft';
import { useFeatures } from '@/lib/features';
import { trainingGoals } from '@/lib/goals';
import { cn } from '@/lib/utils';
import type { CatalogOption, CityOption } from '@/types';

type StepProps = {
    draft: TrainerDraft;
    update: (changes: Partial<TrainerDraft>) => void;
    /** From the catalog. */
    disciplines: CatalogOption[];
    cities: CityOption[];
    /** "In palestra": the approved gyms of MioPersonal. */
    gymOptions: GymOption[];
};

/** A check of step 3: all done to continue. */
export type PlacesCheck = { label: string; done: boolean };

const placeIcons: Record<PlaceType, LucideIcon> = {
    gym: Building2,
    studio: DoorOpen,
    home: House,
    park: Trees,
    online: Video,
};

/** The line under each place, as in the design. */
const placeHints: Record<PlaceType, string> = {
    gym: 'Una palestra di MioPersonal',
    studio: 'Il tuo studio o palestra',
    home: 'Vai tu dal cliente',
    park: 'Parchi e spazi pubblici',
    online: 'In videochiamata',
};

/** A studio counts once it has both name and address (as on the server). */
function studiosComplete(draft: TrainerDraft): boolean {
    return (
        !draft.places.includes('studio') ||
        draft.studios.every(
            (studio) =>
                studio.name.trim() !== '' && studio.address.trim() !== '',
        )
    );
}

/** The checks of step 3: all done to continue. */
export function placesChecks(draft: TrainerDraft): PlacesCheck[] {
    const onlineOnly = draft.places.length > 0 && !needsCity(draft);
    const checks = [
        { label: 'una disciplina', done: draft.disciplines.length > 0 },
        { label: 'un obiettivo', done: draft.goals.length > 0 },
        { label: 'un luogo', done: draft.places.length > 0 },
        { label: 'la città', done: onlineOnly || draft.city !== '' },
    ];

    if (draft.places.includes('gym')) {
        checks.push({ label: 'una palestra', done: draft.gyms.length > 0 });
    }

    if (draft.places.includes('studio')) {
        checks.push({
            label: 'nome e indirizzo dello studio',
            done: studiosComplete(draft),
        });
    }

    return checks;
}

const toggle = <T,>(list: T[], value: T, max: number) =>
    list.includes(value)
        ? list.filter((item) => item !== value)
        : list.length < max
          ? [...list, value]
          : list;

/**
 * Step 3 "Discipline e luoghi": disciplines (max 5) and goals (max 3),
 * where the trainer works (gyms of MioPersonal, studios) and the cities
 * (the main one and up to 2 more). No city for online only. Desktop: the
 * city above the places, as in the design.
 */
export default function StepPlaces({
    part,
    draft,
    update,
    disciplines,
    cities,
    gymOptions,
}: StepProps & {
    /** "Discipline" (step 4) or "Dove alleni" (step 5); left out: both. */
    part?: 'disciplines' | 'places';
}) {
    const cityNeeded = draft.places.length === 0 || needsCity(draft);
    // "In palestra" (a gym of MioPersonal) only while the gyms are switched on.
    const withGyms = useFeatures().gyms;
    const places = placeOptions.filter(
        (option) => withGyms || option.value !== 'gym',
    );

    const placesPart = (
        <div className="flex flex-col gap-8">
            <div
                role="group"
                aria-label="Dove alleni"
                className="grid grid-cols-2 gap-2.5"
            >
                {places.map((option) => (
                    <PlaceCard
                        key={option.value}
                        place={option.value}
                        label={option.label}
                        on={draft.places.includes(option.value)}
                        onToggle={() =>
                            update({
                                places: toggle(
                                    draft.places,
                                    option.value,
                                    placeOptions.length,
                                ),
                            })
                        }
                    />
                ))}
            </div>

            <CitySection
                draft={draft}
                update={update}
                cities={cities}
                optional={!cityNeeded}
            />

            {withGyms && draft.places.includes('gym') && (
                <GymPicker
                    draft={draft}
                    update={update}
                    gymOptions={gymOptions}
                />
            )}
            {draft.places.includes('studio') && (
                <Studios draft={draft} update={update} />
            )}
        </div>
    );

    if (part === 'places') {
        return placesPart;
    }

    return (
        <div className="flex flex-col gap-8">
            <Section
                title="Discipline"
                aside={
                    <Counter>
                        {draft.disciplines.length} di {MAX_DISCIPLINES}
                    </Counter>
                }
            >
                <ChipRow
                    label="Discipline"
                    options={disciplines}
                    isOn={(value) => draft.disciplines.includes(value)}
                    isDisabled={(value) =>
                        !draft.disciplines.includes(value) &&
                        draft.disciplines.length >= MAX_DISCIPLINES
                    }
                    onToggle={(value) =>
                        update({
                            disciplines: toggle(
                                draft.disciplines,
                                value,
                                MAX_DISCIPLINES,
                            ),
                        })
                    }
                />
            </Section>

            <Section
                title="Obiettivi dei clienti"
                aside={
                    <Counter>
                        {draft.goals.length} di {MAX_GOALS}
                    </Counter>
                }
            >
                <ChipRow
                    label="Obiettivi"
                    options={trainingGoals}
                    isOn={(value) => draft.goals.includes(value)}
                    isDisabled={(value) =>
                        !draft.goals.includes(value) &&
                        draft.goals.length >= MAX_GOALS
                    }
                    onToggle={(value) =>
                        update({ goals: toggle(draft.goals, value, MAX_GOALS) })
                    }
                />
            </Section>
            {part === undefined && placesPart}
        </div>
    );
}

/** "In palestra", "Studio privato"…: a card that can be ticked. */
function PlaceCard({
    place,
    label,
    on,
    onToggle,
}: {
    place: PlaceType;
    label: string;
    on: boolean;
    onToggle: () => void;
}) {
    const Icon = placeIcons[place];

    return (
        <button
            type="button"
            role="checkbox"
            aria-checked={on}
            onClick={onToggle}
            className={cn(
                'flex min-h-30 w-full flex-col items-start justify-between gap-3.5 rounded-2xl p-4 text-left text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring',
                on
                    ? 'bg-brand/8 shadow-[inset_0_0_0_1.5px_var(--brand)]'
                    : 'shadow-[inset_0_0_0_1px_var(--input)] hover:bg-foreground/4',
            )}
        >
            <span
                aria-hidden="true"
                className={cn(
                    'flex size-11 shrink-0 items-center justify-center rounded-xl',
                    on ? 'bg-brand text-black' : 'bg-secondary',
                )}
            >
                <Icon className="size-5.5" />
            </span>
            <span className="flex flex-col gap-0.5">
                <span className="text-[17px] font-semibold">{label}</span>
                <span className="text-[13px] leading-4.5 text-muted-foreground">
                    {placeHints[place]}
                </span>
            </span>
        </button>
    );
}

/** "In palestra": the gyms of MioPersonal (the gym confirms each one). */
function GymPicker({
    draft,
    update,
    gymOptions,
}: Pick<StepProps, 'draft' | 'update' | 'gymOptions'>) {
    const chosen = draft.gyms.map((gym) => String(gym.id));
    const options = gymOptions.map((gym) => ({
        value: String(gym.id),
        label: `${gym.name} · ${gym.city}`,
    }));

    const change = (ids: string[]) =>
        update({
            gyms: ids.slice(0, MAX_GYMS).map((id) => {
                const kept = draft.gyms.find((gym) => String(gym.id) === id);
                const option = gymOptions.find((gym) => String(gym.id) === id);

                return (
                    kept ?? {
                        id: Number(id),
                        name: option?.name ?? '',
                        city: option?.city ?? '',
                    }
                );
            }),
        });

    return (
        <DarkCard>
            <span className="flex items-baseline justify-between gap-3">
                <span className="text-[15px] leading-5 font-semibold">
                    Le tue palestre
                </span>
                <Counter>
                    {draft.gyms.length} di {MAX_GYMS}
                </Counter>
            </span>
            {gymOptions.length === 0 ? (
                <p className="text-[13px] leading-4.5 text-muted-foreground">
                    Nessuna palestra iscritta per ora: scegli “Studio privato” e
                    collegala più avanti da “Palestre”.
                </p>
            ) : (
                <OptionsMenu
                    label="Palestre"
                    noneLabel="Nessuna"
                    options={options}
                    multiple
                    value={chosen}
                    onChange={change}
                    searchPlaceholder="Cerca una palestra o una città"
                    className="theme-dark"
                    trigger={
                        <button
                            type="button"
                            className={cn(
                                pillBoxClassName,
                                'w-full justify-between text-left text-[17px] text-muted-foreground outline-none',
                            )}
                        >
                            Scegli le palestre in cui alleni
                            <Plus aria-hidden="true" className="size-5" />
                        </button>
                    }
                />
            )}
            {draft.gyms.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                    {draft.gyms.map((gym) => (
                        <li
                            key={gym.id}
                            className="inline-flex min-h-10 items-center gap-2 rounded-full pr-1 pl-4 text-[15px] shadow-[inset_0_0_0_1.5px_var(--brand)]"
                        >
                            <span className="font-semibold text-brand">
                                {gym.name}
                            </span>
                            <span className="text-[13px] text-muted-foreground">
                                {gym.status === 'accepted'
                                    ? 'Confermata'
                                    : 'In attesa'}
                            </span>
                            <button
                                type="button"
                                aria-label={`Togli ${gym.name}`}
                                onClick={() =>
                                    change(
                                        chosen.filter(
                                            (id) => id !== String(gym.id),
                                        ),
                                    )
                                }
                                className="flex size-8 items-center justify-center rounded-full outline-none hover:bg-foreground/10 focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            >
                                <X aria-hidden="true" className="size-4" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            <p className="text-[13px] leading-4.5 text-muted-foreground">
                La palestra riceve la richiesta e la conferma: poi compare nel
                tuo profilo e tu nel suo.
            </p>
        </DarkCard>
    );
}

/** "Il tuo studio": name and address, up to 3 studios. */
function Studios({ draft, update }: Pick<StepProps, 'draft' | 'update'>) {
    const change = (
        index: number,
        changes: Partial<TrainerDraft['studios'][number]>,
    ) =>
        update({
            studios: draft.studios.map((studio, i) =>
                i === index ? { ...studio, ...changes } : studio,
            ),
        });

    return (
        <div className="flex flex-col gap-2">
            {draft.studios.map((studio, index) => (
                <DarkCard key={index}>
                    <span className="flex items-center justify-between gap-3">
                        <span className="text-[15px] leading-5 font-semibold">
                            {draft.studios.length > 1
                                ? `Studio ${index + 1}`
                                : 'Il tuo studio'}
                        </span>
                        {draft.studios.length > 1 && (
                            <DeleteButton
                                label={`Rimuovi ${studio.name || `lo studio ${index + 1}`}`}
                                onClick={() =>
                                    update({
                                        studios: draft.studios.filter(
                                            (_, i) => i !== index,
                                        ),
                                    })
                                }
                            />
                        )}
                    </span>
                    <div className="flex flex-col gap-2 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:gap-3">
                        <label className={pillBoxClassName}>
                            <span className="sr-only">Nome dello studio</span>
                            <input
                                value={studio.name}
                                placeholder="Nome dello studio"
                                maxLength={100}
                                onChange={(event) =>
                                    change(index, { name: event.target.value })
                                }
                                className={pillInnerClassName}
                            />
                        </label>
                        <label className={pillBoxClassName}>
                            <MapPin
                                aria-hidden="true"
                                className="size-5 shrink-0 text-muted-foreground"
                            />
                            <span className="sr-only">
                                Indirizzo dello studio
                            </span>
                            <input
                                value={studio.address}
                                placeholder="Indirizzo"
                                autoComplete="street-address"
                                maxLength={255}
                                onChange={(event) =>
                                    change(index, {
                                        address: event.target.value,
                                    })
                                }
                                className={pillInnerClassName}
                            />
                        </label>
                    </div>
                </DarkCard>
            ))}
            {draft.studios.length < MAX_STUDIOS && (
                <AddButton
                    onClick={() =>
                        update({
                            studios: [
                                ...draft.studios,
                                { name: '', address: '' },
                            ],
                        })
                    }
                >
                    Aggiungi uno studio
                </AddButton>
            )}
            <p className="text-[13px] leading-4.5 text-muted-foreground">
                Sul profilo mostriamo solo la città. L’indirizzo esatto lo
                riceve il cliente con la conferma.
            </p>
        </div>
    );
}

/**
 * "Città": the main city (from the catalog, suggested while typing) and up
 * to 2 more where the trainer goes. Optional for online only.
 */
function CitySection({
    draft,
    update,
    cities,
    optional,
}: Pick<StepProps, 'draft' | 'update' | 'cities'> & { optional: boolean }) {
    const nameOf = (slug: string) =>
        cities.find((city) => city.value === slug)?.label ?? '';
    const [text, setText] = useState(() => nameOf(draft.city));
    const [otherText, setOtherText] = useState('');
    const chosen = [draft.city, ...draft.otherCities].filter(Boolean);
    const others = cities.filter((city) => !chosen.includes(city.value));

    // The typed name of a city of the catalog counts as choosing it.
    const findCity = (typed: string) =>
        cities.find(
            (city) => city.label.toLowerCase() === typed.trim().toLowerCase(),
        );

    return (
        <Section
            title={<>Città {optional && <Optional>facoltativa</Optional>}</>}
            description={
                optional
                    ? 'Facoltativa: alleni solo online.'
                    : 'I clienti ti trovano cercando questa città.'
            }
        >
            <div className="md:max-w-110">
                <ComboField
                    label="Città"
                    icon={MapPin}
                    placeholder="Es. Bergamo"
                    options={cities.filter(
                        (city) => !draft.otherCities.includes(city.value),
                    )}
                    text={text}
                    onTextChange={(value) => {
                        setText(value);
                        update({ city: findCity(value)?.value ?? '' });
                    }}
                    onSelect={(option) => {
                        setText(option.label);
                        update({ city: option.value });
                    }}
                    autoComplete="address-level2"
                    tone="field"
                />
            </div>

            {!optional && draft.city !== '' && (
                <div className="flex flex-col gap-2.5">
                    <span className="flex items-baseline justify-between gap-3 md:justify-start">
                        <span className="text-[15px] leading-5 font-semibold">
                            Altre città <Optional />
                        </span>
                        <Counter>
                            {draft.otherCities.length} di {MAX_OTHER_CITIES}
                        </Counter>
                    </span>
                    {draft.otherCities.length > 0 && (
                        <ul className="flex flex-wrap gap-2">
                            {draft.otherCities.map((slug) => (
                                <li
                                    key={slug}
                                    className="inline-flex h-10 items-center gap-1 rounded-full pr-1 pl-4 text-[15px] font-semibold text-brand shadow-[inset_0_0_0_1.5px_var(--brand)]"
                                >
                                    {nameOf(slug)}
                                    <button
                                        type="button"
                                        aria-label={`Togli ${nameOf(slug)}`}
                                        onClick={() =>
                                            update({
                                                otherCities:
                                                    draft.otherCities.filter(
                                                        (other) =>
                                                            other !== slug,
                                                    ),
                                            })
                                        }
                                        className="flex size-8 items-center justify-center rounded-full text-foreground outline-none hover:bg-foreground/10 focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                    >
                                        <X
                                            aria-hidden="true"
                                            className="size-4"
                                        />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                    {draft.otherCities.length < MAX_OTHER_CITIES && (
                        <div className="md:max-w-110">
                            <ComboField
                                label="Aggiungi un’altra città"
                                icon={Plus}
                                placeholder="Aggiungi un’altra città"
                                options={others}
                                text={otherText}
                                onTextChange={(value) => {
                                    const city = findCity(value);

                                    if (city && !chosen.includes(city.value)) {
                                        update({
                                            otherCities: [
                                                ...draft.otherCities,
                                                city.value,
                                            ],
                                        });
                                        setOtherText('');

                                        return;
                                    }

                                    setOtherText(value);
                                }}
                                onSelect={(option) => {
                                    update({
                                        otherCities: [
                                            ...draft.otherCities,
                                            option.value,
                                        ],
                                    });
                                    setOtherText('');
                                }}
                            />
                        </div>
                    )}
                    <p className="text-[13px] leading-4.5 text-muted-foreground">
                        Dove vai a domicilio o al parco.
                    </p>
                </div>
            )}
        </Section>
    );
}
