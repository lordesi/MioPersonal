import { Search } from 'lucide-react';
import { useRef, useState } from 'react';
import LocateItem from '@/components/search/locate-item';
import type { MenuOption } from '@/components/search/options-menu';
import type { CityChoice } from '@/components/search/search-bar';
import {
    citiesWithCenter,
    Divider,
    Field,
    variants,
} from '@/components/search/search-bar';
import { Button } from '@/components/ui/button';
import type { GymPriceRange } from '@/lib/gym';
import { gymPriceOptions } from '@/lib/gym';
import { cn } from '@/lib/utils';

export type GymSearchChoices = {
    /** App\Enums\GymAmenity values. */
    servizi: string[];
    city: string | null;
    prezzo: GymPriceRange | null;
};

type FieldName = 'servizi' | 'dove' | 'budget';

type GymSearchBarProps = {
    amenities: MenuOption<string>[];
    cities: CityChoice[];
    applied: GymSearchChoices;
    onSearch: (choices: GymSearchChoices) => void;
    variant?: keyof typeof variants;
};

/**
 * "Servizi · Dove · Budget mensile": the pill of the gyms' search, like
 * SearchBar for the trainers. The choices stay here until "Cerca".
 */
export default function GymSearchBar({
    amenities,
    cities,
    applied,
    onSearch,
    variant = 'search',
}: GymSearchBarProps) {
    const [draft, setDraft] = useState(applied);
    const [openField, setOpenField] = useState<FieldName | null>(null);
    const advancing = useRef(false);
    const searchButton = useRef<HTMLButtonElement>(null);
    const styles = variants[variant];
    const locatable = citiesWithCenter(cities);

    const choose = (
        changes: Partial<GymSearchChoices>,
        next: FieldName | null,
    ) => {
        setDraft((current) => ({ ...current, ...changes }));
        advancing.current = true;
        setOpenField(next);
    };

    const clear = (changes: Partial<GymSearchChoices>) =>
        setDraft((current) => ({ ...current, ...changes }));

    const menu = (field: FieldName) => ({
        open: openField === field,
        onOpenChange: (open: boolean) =>
            setOpenField((current) =>
                open ? field : current === field ? null : current,
            ),
        onCloseAutoFocus: (event: Event) => {
            if (!advancing.current) {
                return;
            }

            event.preventDefault();
            advancing.current = false;

            if (field === 'budget') {
                searchButton.current?.focus();
            }
        },
    });

    return (
        <div className={cn('flex items-center rounded-full', styles.bar)}>
            <Field
                label="Servizi"
                title="Cosa deve avere la palestra?"
                noneLabel="Tutti i servizi"
                options={amenities}
                multiple
                value={draft.servizi}
                onChange={(servizi) => clear({ servizi })}
                onClear={() => clear({ servizi: [] })}
                searchPlaceholder="Cerca un servizio"
                styles={styles}
                {...menu('servizi')}
            />
            <Divider className={styles.divider} />
            <Field
                label="Dove"
                title="Scegli una città"
                noneLabel="Tutta Italia"
                options={cities}
                value={draft.city}
                onChange={(city) => choose({ city }, 'budget')}
                onClear={() => clear({ city: null })}
                searchPlaceholder="Cerca una città"
                header={
                    locatable.length > 0 && (
                        <LocateItem
                            cities={locatable}
                            onFound={(city) =>
                                choose({ city: city.value }, 'budget')
                            }
                        />
                    )
                }
                styles={styles}
                {...menu('dove')}
            />
            <Divider className={styles.divider} />
            <Field
                label="Budget mensile"
                title="Quanto vuoi spendere al mese?"
                noneLabel="Qualsiasi prezzo"
                options={gymPriceOptions}
                value={draft.prezzo}
                onChange={(prezzo) => choose({ prezzo }, null)}
                onClear={() => clear({ prezzo: null })}
                styles={styles}
                {...menu('budget')}
            />
            <Button
                ref={searchButton}
                type="button"
                onClick={() => onSearch(draft)}
                className={cn(
                    'shrink-0 rounded-full font-semibold',
                    styles.button,
                )}
            >
                <Search
                    aria-hidden="true"
                    strokeWidth={2.5}
                    className="size-4.5"
                />
                Cerca
            </Button>
        </div>
    );
}
