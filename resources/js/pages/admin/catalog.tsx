import { Head, router } from '@inertiajs/react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import type { ComponentProps } from 'react';
import AdminDisciplineController from '@/actions/App/Http/Controllers/Admin/AdminDisciplineController';
import AdminPanel from '@/components/admin/admin-panel';
import CityDialog from '@/components/admin/city-dialog';
import DisciplineDialog from '@/components/admin/discipline-dialog';
import SectionLabel from '@/components/shared/section-label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AdminCity, AdminDiscipline } from '@/types';

type CatalogProps = {
    /** In the order of the search filters, hidden ones included. */
    disciplines: AdminDiscipline[];
    /** Region => its cities, in alphabetical order. */
    citiesByRegion: Record<string, AdminCity[]>;
    /** The 20 regions, for the city form. */
    regions: string[];
};

/**
 * It must pass on every prop: the dialog trigger gives it the click and the
 * accessibility attributes that open the window.
 */
function AddButton(props: ComponentProps<typeof Button>) {
    return (
        <Button type="button" size="sm" className="font-semibold" {...props}>
            + Aggiungi
        </Button>
    );
}

function HiddenBadge() {
    return (
        <Badge
            variant="outline"
            className="h-5 rounded-full px-1.5 text-[11px] text-muted-foreground"
        >
            Nascosta
        </Badge>
    );
}

/** ↑ ↓: swaps the discipline with the one before or after it. */
function move(discipline: AdminDiscipline, direction: 'up' | 'down') {
    router.post(
        AdminDisciplineController.move.url(discipline.id),
        { direction },
        { preserveScroll: true },
    );
}

export default function Catalog({
    disciplines,
    citiesByRegion,
    regions,
}: CatalogProps) {
    const cities = Object.values(citiesByRegion).flat();
    const hiddenCities = cities.filter((city) => !city.isActive).length;

    return (
        <>
            <Head title="Admin · Discipline e città" />

            <div className="grid items-start gap-4 xl:grid-cols-2">
                <AdminPanel
                    title="Discipline"
                    aside={<DisciplineDialog trigger={<AddButton />} />}
                >
                    <ul>
                        {disciplines.map((discipline, index) => (
                            <li
                                key={discipline.id}
                                className="flex items-center gap-2 border-b py-2 text-sm"
                            >
                                <span className="flex">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        aria-label={`Sposta ${discipline.name} più su`}
                                        disabled={index === 0}
                                        onClick={() => move(discipline, 'up')}
                                        className="size-8"
                                    >
                                        <ArrowUp />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        aria-label={`Sposta ${discipline.name} più giù`}
                                        disabled={
                                            index === disciplines.length - 1
                                        }
                                        onClick={() => move(discipline, 'down')}
                                        className="size-8"
                                    >
                                        <ArrowDown />
                                    </Button>
                                </span>
                                <span
                                    className={cn(
                                        'flex flex-1 items-center gap-2 font-medium',
                                        !discipline.isActive &&
                                            'text-muted-foreground',
                                    )}
                                >
                                    {discipline.name}
                                    {!discipline.isActive && <HiddenBadge />}
                                </span>
                                <span className="text-xs text-muted-foreground tabular-nums">
                                    {discipline.trainerCount} trainer
                                </span>
                                <DisciplineDialog
                                    discipline={discipline}
                                    trigger={
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            aria-label={`Modifica ${discipline.name}`}
                                            className="h-7.5 text-xs"
                                        >
                                            Modifica
                                        </Button>
                                    }
                                />
                            </li>
                        ))}
                    </ul>
                    <span className="text-xs text-muted-foreground">
                        L’ordine è quello mostrato nei filtri. Una disciplina
                        usata da trainer attivi si può nascondere, non
                        cancellare.
                    </span>
                </AdminPanel>

                <AdminPanel
                    title="Città"
                    aside={
                        <CityDialog regions={regions} trigger={<AddButton />} />
                    }
                >
                    <span className="text-xs text-muted-foreground tabular-nums">
                        {cities.length} città
                        {hiddenCities > 0 && ` (${hiddenCities} nascoste)`}: i
                        capoluoghi di provincia (elenco ISTAT). Tocca una città
                        per modificarla o nasconderla.
                    </span>
                    {Object.entries(citiesByRegion).map(
                        ([region, regionCities]) => (
                            <div key={region} className="flex flex-col gap-1.5">
                                <SectionLabel as="h3">{region}</SectionLabel>
                                <ul className="flex flex-wrap gap-1.5">
                                    {regionCities.map((city) => (
                                        <li key={city.id}>
                                            <CityDialog
                                                city={city}
                                                regions={regions}
                                                trigger={
                                                    <button
                                                        type="button"
                                                        aria-label={`Modifica ${city.name}${city.isActive ? '' : ' (nascosta)'}`}
                                                        className={cn(
                                                            'flex h-7.5 items-center rounded-full border px-3 text-[13px] hover:bg-accent',
                                                            city.isActive
                                                                ? 'border-input'
                                                                : 'border-dashed text-muted-foreground line-through',
                                                        )}
                                                    >
                                                        {city.name}
                                                    </button>
                                                }
                                            />
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ),
                    )}
                </AdminPanel>
            </div>
        </>
    );
}

Catalog.layout = { section: 'catalog' };
