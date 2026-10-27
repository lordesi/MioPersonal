import { Building2, Check, House, Target, Trees, Video } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useId } from 'react';
import type {
    PlaceType,
    TrainerDraft,
} from '@/components/onboarding/trainer/draft';
import {
    MAX_DISCIPLINES,
    MAX_GOALS,
    needsCity,
    placeOptions,
} from '@/components/onboarding/trainer/draft';
import {
    DarkPanel,
    StepColumns,
} from '@/components/onboarding/trainer/onboarding-shell';
import type { PanelCheck } from '@/components/onboarding/trainer/search-card-preview';
import SearchCardPreview, {
    PanelChecklist,
} from '@/components/onboarding/trainer/search-card-preview';
import NumberedSection from '@/components/trainer/area/numbered-section';
import {
    Chip,
    Cities,
    Group,
    Studios,
} from '@/components/trainer/profile/search-section';
import { trainingGoals } from '@/lib/goals';
import { cn } from '@/lib/utils';
import type { CatalogOption, CityOption } from '@/types';

type StepProps = {
    draft: TrainerDraft;
    update: (changes: Partial<TrainerDraft>) => void;
    /** The trainer's name and photo, in the preview. */
    name: string;
    photo: string | null;
    /** From the catalog. */
    disciplines: CatalogOption[];
    cities: CityOption[];
};

const placeIcons: Record<PlaceType, LucideIcon> = {
    studio: Building2,
    home: House,
    park: Trees,
    online: Video,
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
export function placesChecks(draft: TrainerDraft): PanelCheck[] {
    const onlineOnly = draft.places.length > 0 && !needsCity(draft);
    const checks = [
        {
            label: 'Almeno una disciplina',
            done: draft.disciplines.length > 0,
        },
        {
            label: 'Almeno un obiettivo',
            done: draft.goals.length > 0,
        },
        {
            label: 'Almeno un luogo',
            done: draft.places.length > 0,
        },
        {
            label: onlineOnly
                ? 'Città facoltativa (solo online)'
                : 'Almeno una città',
            done: onlineOnly || draft.city !== '',
        },
    ];

    if (draft.places.includes('studio')) {
        checks.push({
            label: 'Nome e indirizzo di ogni studio',
            done: studiosComplete(draft),
        });
    }

    return checks;
}

/**
 * Step 3: disciplines (max 5) and goals (max 3), where the trainer works
 * (with the studios' addresses) and in which cities (max 3, the first is
 * the main one). Not needed for online only.
 */
export default function StepPlaces({
    draft,
    update,
    name,
    photo,
    disciplines,
    cities,
}: StepProps) {
    const toggle = <T extends string>(list: T[], value: T, max: number) =>
        list.includes(value)
            ? list.filter((item) => item !== value)
            : list.length < max
              ? [...list, value]
              : list;

    return (
        <StepColumns
            aside={
                <DarkPanel title="Così ti vedono nella ricerca">
                    <SearchCardPreview
                        draft={draft}
                        name={name}
                        photo={photo}
                        disciplines={disciplines}
                        cities={cities}
                        search
                    />
                    <PanelChecklist
                        checks={placesChecks(draft)}
                        className="border-t border-sidebar-border pt-4"
                    />
                </DarkPanel>
            }
        >
            <NumberedSection
                step={1}
                title="Discipline e obiettivi"
                className="gap-5.5"
            >
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
                <div className="h-px bg-border" />
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
                                disabled={
                                    !on && draft.goals.length >= MAX_GOALS
                                }
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
            </NumberedSection>

            <NumberedSection step={2} title="Dove alleni" className="gap-5.5">
                <PlaceCards draft={draft} update={update} />
                {draft.places.includes('studio') && (
                    <Studios draft={draft} update={update} />
                )}
                {needsCity(draft) && (
                    <>
                        <div className="h-px bg-border" />
                        <Cities draft={draft} update={update} cities={cities} />
                    </>
                )}
            </NumberedSection>
        </StepColumns>
    );
}

/** The four ways of training: icon, name and a check, black when chosen. */
function PlaceCards({ draft, update }: Pick<StepProps, 'draft' | 'update'>) {
    const labelId = useId();

    return (
        <div
            role="group"
            aria-label="Dove alleni"
            aria-describedby={labelId}
            className="grid grid-cols-2 gap-2 sm:grid-cols-4"
        >
            <span id={labelId} className="sr-only">
                Puoi sceglierne più di uno.
            </span>
            {placeOptions.map((place) => {
                const on = draft.places.includes(place.value);
                const Icon = placeIcons[place.value];

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
                            'flex min-w-0 flex-col items-start gap-3 rounded-2xl border p-3 text-left transition-colors',
                            on
                                ? 'border-foreground bg-foreground text-background'
                                : 'bg-card hover:bg-muted/50',
                        )}
                    >
                        <span className="flex w-full items-center justify-between gap-2">
                            <span
                                className={cn(
                                    'flex size-9 items-center justify-center rounded-[10px]',
                                    on ? 'bg-foreground/85' : 'bg-secondary',
                                )}
                            >
                                <Icon
                                    aria-hidden="true"
                                    className={cn(
                                        'size-4.5',
                                        on && 'text-background',
                                    )}
                                />
                            </span>
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
                        </span>
                        <span className="flex flex-col gap-0.5">
                            <span className="text-[15px] leading-5.5 font-semibold">
                                {place.label}
                            </span>
                            <span
                                className={cn(
                                    'text-[13px] leading-4.5',
                                    on
                                        ? 'text-background/70'
                                        : 'text-muted-foreground',
                                )}
                            >
                                {place.hint}
                            </span>
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
