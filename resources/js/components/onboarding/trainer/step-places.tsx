import { Plus, Trash2, X } from 'lucide-react';
import { useId } from 'react';
import type { ReactNode } from 'react';
import FormField from '@/components/auth/form-field';
import type { TrainerDraft } from '@/components/onboarding/trainer/draft';
import {
    MAX_DISCIPLINES,
    MAX_OTHER_CITIES,
    MAX_STUDIOS,
    needsCity,
    placeOptions,
} from '@/components/onboarding/trainer/draft';
import StepTitle from '@/components/onboarding/trainer/step-title';
import FilterSelect from '@/components/search/filter-select';
import ChoiceChips from '@/components/shared/choice-chips';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { CatalogOption, CityOption } from '@/types';

type StepProps = {
    draft: TrainerDraft;
    update: (changes: Partial<TrainerDraft>) => void;
    /** From the catalog. */
    disciplines: CatalogOption[];
    cities: CityOption[];
};

/**
 * Step 3: disciplines (max 5), where the trainer works (max 3 places in
 * person) and in which cities (the main one + max 2 others).
 */
export default function StepPlaces({
    draft,
    update,
    disciplines,
    cities,
}: StepProps) {
    const hasStudio = draft.places.includes('studio');
    const cityName = (slug: string) =>
        cities.find((city) => city.value === slug)?.label ?? slug;
    // The main city and the ones already added can't be added again.
    const addableCities = cities.filter(
        (city) =>
            city.value !== draft.city &&
            !draft.otherCities.includes(city.value),
    );

    const togglePlace = (place: TrainerDraft['places'][number]) =>
        update({
            places: draft.places.includes(place)
                ? draft.places.filter((item) => item !== place)
                : [...draft.places, place],
        });

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
        <>
            <StepTitle
                title="Discipline, luoghi e città"
                description="Servono a farti trovare dai clienti giusti nella ricerca."
            />

            <Group
                legend="Discipline"
                note={`${draft.disciplines.length} di ${MAX_DISCIPLINES} al massimo`}
            >
                {(labelId) => (
                    <ChoiceChips
                        multiple
                        aria-labelledby={labelId}
                        options={disciplines}
                        value={draft.disciplines}
                        onChange={(disciplines) =>
                            disciplines.length <= MAX_DISCIPLINES &&
                            update({ disciplines })
                        }
                    />
                )}
            </Group>

            <Group legend="Dove alleni">
                {(labelId) => (
                    <div
                        role="group"
                        aria-labelledby={labelId}
                        className="grid grid-cols-2 gap-2 md:grid-cols-4"
                    >
                        {placeOptions.map((place) => {
                            const on = draft.places.includes(place.value);

                            return (
                                <button
                                    key={place.value}
                                    type="button"
                                    aria-pressed={on}
                                    onClick={() => togglePlace(place.value)}
                                    className={cn(
                                        'flex flex-col items-start gap-0.5 rounded-lg bg-background px-3.5 py-3 text-left',
                                        on
                                            ? 'border-2 border-primary'
                                            : 'border',
                                    )}
                                >
                                    <span className="text-sm font-semibold">
                                        {place.label}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {place.hint}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </Group>

            {hasStudio && (
                <Group
                    legend="Dove alleni in presenza"
                    note={`studi, palestre o centri sportivi · ${draft.studios.length} di ${MAX_STUDIOS} al massimo`}
                >
                    {() => (
                        <div className="flex flex-col gap-3">
                            {draft.studios.map((studio, index) => (
                                <div
                                    key={index}
                                    className="grid items-end gap-3 rounded-lg border p-3 sm:grid-cols-[1fr_1.4fr_auto]"
                                >
                                    <FormField label="Nome del luogo">
                                        {({ id }) => (
                                            <Input
                                                id={id}
                                                placeholder="Es. Palestra FitLab"
                                                value={studio.name}
                                                onChange={(event) =>
                                                    updateStudio(index, {
                                                        name: event.target
                                                            .value,
                                                    })
                                                }
                                            />
                                        )}
                                    </FormField>
                                    <FormField label="Indirizzo">
                                        {({ id }) => (
                                            <Input
                                                id={id}
                                                autoComplete="street-address"
                                                placeholder="Via, numero civico, città"
                                                value={studio.address}
                                                onChange={(event) =>
                                                    updateStudio(index, {
                                                        address:
                                                            event.target.value,
                                                    })
                                                }
                                            />
                                        )}
                                    </FormField>
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
                                    >
                                        <Trash2 />
                                    </Button>
                                </div>
                            ))}
                            <Button
                                type="button"
                                variant="outline"
                                className="self-start"
                                disabled={draft.studios.length >= MAX_STUDIOS}
                                onClick={() =>
                                    update({
                                        studios: [
                                            ...draft.studios,
                                            { name: '', address: '' },
                                        ],
                                    })
                                }
                            >
                                <Plus aria-hidden="true" />
                                Aggiungi indirizzo
                            </Button>
                            <span className="text-xs text-muted-foreground">
                                Sul profilo mostriamo solo la città di ogni
                                luogo. L’indirizzo esatto lo riceve il cliente
                                con la conferma.
                            </span>
                        </div>
                    )}
                </Group>
            )}

            {needsCity(draft) && (
                <>
                    <FilterSelect
                        id="trainer-city"
                        label="La tua città"
                        noneLabel="Scegli la città"
                        options={cities}
                        value={draft.city || null}
                        onChange={(city) =>
                            update({
                                city: city ?? '',
                                otherCities: draft.otherCities.filter(
                                    (other) => other !== city,
                                ),
                            })
                        }
                        highlight={false}
                        className="max-w-80"
                    />

                    <Group
                        legend="Altre città in cui ti sposti"
                        note={`${draft.otherCities.length} di ${MAX_OTHER_CITIES} al massimo`}
                    >
                        {(labelId) => (
                            <div
                                role="group"
                                aria-labelledby={labelId}
                                className="flex flex-col gap-2.5"
                            >
                                {draft.otherCities.length > 0 && (
                                    <ul className="flex flex-wrap gap-2">
                                        {draft.otherCities.map((slug) => (
                                            <li
                                                key={slug}
                                                className="flex h-9 items-center gap-1 rounded-full border bg-background pr-1 pl-3.5 text-sm"
                                            >
                                                {cityName(slug)}
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    aria-label={`Togli ${cityName(slug)}`}
                                                    className="size-7 rounded-full"
                                                    onClick={() =>
                                                        update({
                                                            otherCities:
                                                                draft.otherCities.filter(
                                                                    (other) =>
                                                                        other !==
                                                                        slug,
                                                                ),
                                                        })
                                                    }
                                                >
                                                    <X />
                                                </Button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {/* At the limit the menu goes away: remove a city to add another. */}
                                {draft.otherCities.length <
                                    MAX_OTHER_CITIES && (
                                    <FilterSelect
                                        id="trainer-other-city"
                                        label="Aggiungi una città"
                                        noneLabel="Scegli una città"
                                        options={addableCities}
                                        value={null}
                                        onChange={(city) =>
                                            city &&
                                            update({
                                                otherCities: [
                                                    ...draft.otherCities,
                                                    city,
                                                ],
                                            })
                                        }
                                        highlight={false}
                                        className="max-w-80"
                                    />
                                )}
                            </div>
                        )}
                    </Group>
                </>
            )}
        </>
    );
}

function Group({
    legend,
    note,
    children,
}: {
    legend: string;
    note?: string;
    children: (labelId: string) => ReactNode;
}) {
    const labelId = useId();

    return (
        <div className="flex flex-col gap-2.5">
            <span
                id={labelId}
                className="text-[15px] font-semibold tabular-nums"
            >
                {legend}
                {note && (
                    <span className="font-normal text-muted-foreground">
                        {' '}
                        · {note}
                    </span>
                )}
            </span>
            {children(labelId)}
        </div>
    );
}
