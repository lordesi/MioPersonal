import { Search } from 'lucide-react';
import { Fragment, useRef, useState } from 'react';
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
import { cn } from '@/lib/utils';

export type SimpleField = {
    /** The key in the choices, e.g. "giorno"; "city" is the city. */
    name: string;
    label: string;
    title: string;
    noneLabel: string;
    options: MenuOption<string>[];
    searchPlaceholder?: string;
};

type SimpleSearchBarProps = {
    /** The fields in order; a field named "city" offers "Usa la mia posizione". */
    fields: SimpleField[];
    cities: CityChoice[];
    onSearch: (choices: Record<string, string | null>) => void;
    variant?: keyof typeof variants;
};

/**
 * "Disciplina · Dove · Giorno": the pill of the courses' and events'
 * searches, like GymSearchBar. Each choice opens the next field; the
 * choices stay here until "Cerca".
 */
export default function SimpleSearchBar({
    fields,
    cities,
    onSearch,
    variant = 'hero',
}: SimpleSearchBarProps) {
    const [draft, setDraft] = useState<Record<string, string | null>>({});
    const [openField, setOpenField] = useState<string | null>(null);
    const advancing = useRef(false);
    const searchButton = useRef<HTMLButtonElement>(null);
    const styles = variants[variant];
    const locatable = citiesWithCenter(cities);

    const choose = (name: string, value: string | null) => {
        const index = fields.findIndex((field) => field.name === name);
        setDraft((current) => ({ ...current, [name]: value }));
        advancing.current = true;
        setOpenField(fields[index + 1]?.name ?? null);
    };

    const menu = (name: string, last: boolean) => ({
        open: openField === name,
        onOpenChange: (open: boolean) =>
            setOpenField((current) =>
                open ? name : current === name ? null : current,
            ),
        onCloseAutoFocus: (event: Event) => {
            if (!advancing.current) {
                return;
            }

            event.preventDefault();
            advancing.current = false;

            if (last) {
                searchButton.current?.focus();
            }
        },
    });

    return (
        <div className={cn('flex items-center rounded-full', styles.bar)}>
            {fields.map((field, index) => (
                <Fragment key={field.name}>
                    {index > 0 && <Divider className={styles.divider} />}
                    <Field
                        label={field.label}
                        title={field.title}
                        noneLabel={field.noneLabel}
                        options={field.options}
                        value={draft[field.name] ?? null}
                        onChange={(value) => choose(field.name, value)}
                        onClear={() =>
                            setDraft((current) => ({
                                ...current,
                                [field.name]: null,
                            }))
                        }
                        searchPlaceholder={field.searchPlaceholder}
                        header={
                            field.name === 'city' &&
                            locatable.length > 0 && (
                                <LocateItem
                                    cities={locatable}
                                    onFound={(city) =>
                                        choose('city', city.value)
                                    }
                                />
                            )
                        }
                        styles={styles}
                        {...menu(field.name, index === fields.length - 1)}
                    />
                </Fragment>
            ))}
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
