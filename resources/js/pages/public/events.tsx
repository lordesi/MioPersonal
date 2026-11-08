import { Head, router } from '@inertiajs/react';
import { CalendarDays } from 'lucide-react';
import { EventGrid } from '@/components/events/event-card';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { WHEN_OPTIONS } from '@/lib/events';
import { search } from '@/routes/events';
import type { CatalogOption, GroupSessionSummary, SeoData } from '@/types';

type Filters = {
    quando: string | null;
    tipo: string | null;
    disciplina: string | null;
};

type EventsProps = {
    seo: SeoData;
    city: { slug: string; name: string } | null;
    events: GroupSessionSummary[];
    total: number;
    filters: Filters;
    types: CatalogOption[];
    disciplines: CatalogOption[];
    cities: CatalogOption[];
};

const ALL = 'all';

/** "Eventi": the next events of trainers and gyms, in Italy or in a city. */
export default function Events({
    seo,
    city,
    events,
    total,
    filters,
    types,
    disciplines,
    cities,
}: EventsProps) {
    const place = city ? `a ${city.name}` : 'in Italia';

    const visit = (
        changes: Partial<Filters>,
        nextCity = city?.slug ?? null,
    ) => {
        const next = { ...filters, ...changes };
        const query = Object.fromEntries(
            Object.entries(next).filter(([, value]) => value),
        );

        router.get(
            search.url(nextCity ? { city: nextCity } : {}, { query }),
            {},
            { preserveScroll: true, preserveState: true, replace: true },
        );
    };

    const filtered = Boolean(
        filters.quando || filters.tipo || filters.disciplina,
    );

    return (
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pt-6 pb-12 md:gap-10 md:px-8 md:pt-12 md:pb-20">
            <Head title={seo.title} />

            <div className="flex flex-col gap-2">
                <span className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                    <CalendarDays aria-hidden="true" className="size-4" />
                    Workshop, open day, allenamenti di gruppo
                </span>
                <h1 className="text-[32px] leading-9.5 font-bold tracking-tighter md:text-5xl md:leading-13">
                    Eventi {place}
                </h1>
                <p className="max-w-150 text-muted-foreground">
                    Gli appuntamenti dei personal trainer e delle palestre di
                    MioPersonal. Prenoti il posto qui, paghi sul posto.
                </p>
            </div>

            <div
                role="group"
                aria-label="Filtri"
                className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap"
            >
                <Select
                    value={city?.slug ?? ALL}
                    onValueChange={(value) =>
                        visit({}, value === ALL ? null : value)
                    }
                >
                    <SelectTrigger aria-label="Città" className="h-11 sm:w-48">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL}>Tutta Italia</SelectItem>
                        {cities.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                                {item.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select
                    value={filters.quando ?? ALL}
                    onValueChange={(value) =>
                        visit({ quando: value === ALL ? null : value })
                    }
                >
                    <SelectTrigger aria-label="Quando" className="h-11 sm:w-48">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL}>Tutte le date</SelectItem>
                        {WHEN_OPTIONS.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                                {item.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select
                    value={filters.tipo ?? ALL}
                    onValueChange={(value) =>
                        visit({ tipo: value === ALL ? null : value })
                    }
                >
                    <SelectTrigger aria-label="Tipo" className="h-11 sm:w-52">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL}>Tutti i tipi</SelectItem>
                        {types.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                                {item.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select
                    value={filters.disciplina ?? ALL}
                    onValueChange={(value) =>
                        visit({ disciplina: value === ALL ? null : value })
                    }
                >
                    <SelectTrigger
                        aria-label="Disciplina"
                        className="h-11 sm:w-52"
                    >
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL}>Tutte le discipline</SelectItem>
                        {disciplines.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                                {item.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <p
                aria-live="polite"
                className="-mt-4 text-sm text-muted-foreground tabular-nums md:-mt-6"
            >
                {total === 1 ? '1 evento' : `${total} eventi`}
            </p>

            {events.length > 0 ? (
                <EventGrid events={events} />
            ) : (
                <div className="flex flex-col items-start gap-3 rounded-2xl bg-muted px-4 py-4 text-sm">
                    <p>
                        {filtered
                            ? 'Nessun evento con questi filtri.'
                            : `Nessun evento in programma ${place} per ora.`}
                    </p>
                    {(filtered || city) && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                                visit(
                                    {
                                        quando: null,
                                        tipo: null,
                                        disciplina: null,
                                    },
                                    filtered ? (city?.slug ?? null) : null,
                                )
                            }
                        >
                            {filtered
                                ? 'Cancella i filtri'
                                : 'Vedi tutta Italia'}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
