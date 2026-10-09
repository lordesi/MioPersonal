import { Head } from '@inertiajs/react';
import { GripVertical } from 'lucide-react';
import AdminPanel from '@/components/admin/admin-panel';
import SectionLabel from '@/components/shared/section-label';
import { Button } from '@/components/ui/button';
import type { AdminDiscipline } from '@/types';

type CatalogProps = {
    disciplines: AdminDiscipline[];
    zones: { milano: { name: string }[]; provincia: { name: string }[] };
};

// TODO: add, edit, sort and hide disciplines and zones once they are stored.
function AddButton() {
    return (
        <Button type="button" size="sm" className="font-semibold">
            + Aggiungi
        </Button>
    );
}

function ZoneChips({ zones }: { zones: { name: string }[] }) {
    return (
        <ul className="flex flex-wrap gap-1.5">
            {zones.map((zone) => (
                <li
                    key={zone.name}
                    className="flex h-7.5 items-center rounded-full border border-input px-3 text-[13px]"
                >
                    {zone.name}
                </li>
            ))}
        </ul>
    );
}

export default function Catalog({ disciplines, zones }: CatalogProps) {
    return (
        <>
            <Head title="Admin · Discipline e zone" />

            <div className="grid items-start gap-4 xl:grid-cols-2">
                <AdminPanel title="Discipline" aside={<AddButton />}>
                    <ul>
                        {disciplines.map((discipline) => (
                            <li
                                key={discipline.id}
                                className="flex items-center gap-2.5 border-b py-2.5 text-sm"
                            >
                                <GripVertical
                                    aria-hidden="true"
                                    className="size-4 cursor-grab text-muted-foreground"
                                />
                                <span className="flex-1 font-medium">
                                    {discipline.name}
                                </span>
                                <span className="text-xs text-muted-foreground tabular-nums">
                                    {discipline.trainerCount} trainer
                                </span>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7.5 text-xs"
                                >
                                    Modifica
                                </Button>
                            </li>
                        ))}
                    </ul>
                    <span className="text-xs text-muted-foreground">
                        L’ordine è quello mostrato nei filtri. Una disciplina
                        usata da trainer attivi si può nascondere, non
                        cancellare.
                    </span>
                </AdminPanel>

                <AdminPanel title="Zone" aside={<AddButton />}>
                    <SectionLabel as="h3">Milano</SectionLabel>
                    <ZoneChips zones={zones.milano} />
                    <SectionLabel as="h3">Provincia</SectionLabel>
                    <ZoneChips zones={zones.provincia} />
                </AdminPanel>
            </div>
        </>
    );
}

Catalog.layout = { section: 'catalog' };
