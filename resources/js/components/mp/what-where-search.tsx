import { LocateFixed, MapPin, Search } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import ComboField, { findOption } from '@/components/mp/combo-field';
import type { ComboOption } from '@/components/mp/combo-field';
import { Spinner } from '@/components/ui/spinner';
import { useLocateCity } from '@/hooks/use-locate-city';
import { cn } from '@/lib/utils';
import type { CatalogOption, CityWithCoordinates } from '@/types';

/** What is in a field: the text, and the option it names (if any). */
export type FieldChoice = { text: string; value: string | null };

export const emptyChoice: FieldChoice = { text: '', value: null };

export type WhatWhereResult = {
    /** The option of "Cosa" (a discipline, a service…), or null. */
    what: string | null;
    /** Free text of "Cosa" that names no option, e.g. a trainer's name. */
    words: string | null;
    /** Slug of the city; null = all of Italy. */
    city: string | null;
};

type WhatWhereSearchProps = {
    what: {
        label?: string;
        placeholder: string;
        options: readonly ComboOption[];
    };
    /** With the center: "Usa la mia posizione" on top of the list. */
    cities: readonly (CatalogOption | CityWithCoordinates)[];
    initialWhat?: FieldChoice;
    initialCity?: FieldChoice;
    onSearch: (result: WhatWhereResult) => void;
    submitLabel: string;
    /** stack: one under the other (phones, the hero); row: side by side from md up. */
    layout?: 'stack' | 'row';
    size?: 'md' | 'lg';
    /** After the button in the row, e.g. "Filtri". */
    children?: ReactNode;
    className?: string;
};

const hasCoordinates = (
    cities: WhatWhereSearchProps['cities'],
): cities is readonly CityWithCoordinates[] =>
    cities.length > 0 && 'lat' in cities[0];

/**
 * "Cosa · Dove · Cerca" of the dark pages. "Cosa" suggests the options and
 * keeps any other text (e.g. a name); "Dove" suggests the cities, and a city
 * written in full counts as chosen.
 */
export default function WhatWhereSearch({
    what,
    cities,
    initialWhat = emptyChoice,
    initialCity = emptyChoice,
    onSearch,
    submitLabel,
    layout = 'stack',
    size = 'lg',
    children,
    className,
}: WhatWhereSearchProps) {
    const [whatChoice, setWhatChoice] = useState(initialWhat);
    const [cityChoice, setCityChoice] = useState(initialCity);

    const submit = (event: FormEvent) => {
        event.preventDefault();
        const option =
            whatChoice.value ??
            findOption(what.options, whatChoice.text)?.value;
        const words = whatChoice.text.trim();
        const city = cityChoice.value ?? findCity(cities, cityChoice.text);

        onSearch({
            what: option ?? null,
            words: option || words === '' ? null : words,
            city,
        });
    };

    return (
        <form
            role="search"
            onSubmit={submit}
            className={cn(
                'flex flex-col gap-2.5',
                layout === 'row' && 'md:flex-row md:items-center',
                className,
            )}
        >
            <ComboField
                label={what.label ?? 'Cosa'}
                icon={Search}
                type="search"
                placeholder={what.placeholder}
                options={what.options}
                text={whatChoice.text}
                onTextChange={(text) => setWhatChoice({ text, value: null })}
                onSelect={(option) =>
                    setWhatChoice({ text: option.label, value: option.value })
                }
                size={size}
                className={cn(layout === 'row' && 'md:flex-1')}
            />
            <ComboField
                label="Dove"
                icon={MapPin}
                placeholder="Città o zona"
                autoComplete="address-level2"
                options={cities}
                text={cityChoice.text}
                onTextChange={(text) => setCityChoice({ text, value: null })}
                onSelect={(option) =>
                    setCityChoice({ text: option.label, value: option.value })
                }
                header={
                    hasCoordinates(cities) ? (
                        <LocateButton
                            cities={cities}
                            onFound={(city) =>
                                setCityChoice({
                                    text: city.label,
                                    value: city.value,
                                })
                            }
                        />
                    ) : undefined
                }
                size={size}
                className={cn(layout === 'row' && 'md:flex-1')}
            />
            <button
                type="submit"
                className={cn(
                    'btn-brand text-[17px]',
                    size === 'lg' ? 'h-12.5' : 'h-12',
                    layout === 'stack' ? 'mt-1 w-full' : 'w-full md:w-45',
                )}
            >
                {submitLabel}
            </button>
            {children}
        </form>
    );
}

/** The slug of the city written in "Dove": in full, or the first starting so. */
function findCity(cities: readonly ComboOption[], text: string): string | null {
    const exact = findOption(cities, text);

    if (exact) {
        return exact.value;
    }

    const start = text.trim().toLowerCase();

    return start === ''
        ? null
        : (cities.find((city) => city.label.toLowerCase().startsWith(start))
              ?.value ?? null);
}

function LocateButton({
    cities,
    onFound,
}: {
    cities: readonly CityWithCoordinates[];
    onFound: (city: CityWithCoordinates) => void;
}) {
    const { locate, locating, error } = useLocateCity([...cities], onFound);

    return (
        <div className="mb-1.5 flex flex-col gap-1 border-b border-border pb-1.5">
            <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={locate}
                disabled={locating}
                className="flex min-h-11 items-center gap-3 rounded-2xl px-3 text-left text-[15px] font-semibold text-brand outline-none hover:bg-accent focus-visible:bg-accent disabled:opacity-70"
            >
                {locating ? (
                    <Spinner className="size-4" />
                ) : (
                    <LocateFixed aria-hidden="true" className="size-4" />
                )}
                {locating ? 'Cerco la tua posizione…' : 'Usa la mia posizione'}
            </button>
            {error && (
                <p role="alert" className="px-3 text-[13px] text-destructive">
                    {error}
                </p>
            )}
        </div>
    );
}
