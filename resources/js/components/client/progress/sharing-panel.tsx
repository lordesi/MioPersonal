import { router } from '@inertiajs/react';
import { useId, useState } from 'react';
import ClientSharingController from '@/actions/App/Http/Controllers/ClientSharingController';
import Panel from '@/components/trainer/area/panel';
import { Switch } from '@/components/ui/switch';
import type { ProgressSharing } from '@/types';

type SharingPanelProps = {
    sharing: ProgressSharing[];
    /** The weight is shared only with the consent to body data. */
    sharesWeight: boolean;
};

/**
 * "Condividi i tuoi progressi": one switch per trainer the client trained
 * with, off until the client turns it on. Says exactly what the trainer
 * sees, and that it can be turned off any time.
 */
export default function SharingPanel({
    sharing,
    sharesWeight,
}: SharingPanelProps) {
    return (
        <Panel title="Condividi i tuoi progressi" className="gap-3">
            <p className="text-sm text-muted-foreground">
                Chi attivi vede i tuoi allenamenti, le settimane di fila e il
                tuo obiettivo
                {sharesWeight ? ', e il peso' : ''}. Le note che scrivi restano
                tue. Puoi spegnere quando vuoi.
            </p>
            <ul className="flex flex-col divide-y">
                {sharing.map((item) => (
                    <SharingRow key={item.recordId} item={item} />
                ))}
            </ul>
        </Panel>
    );
}

function SharingRow({ item }: { item: ProgressSharing }) {
    const id = useId();
    const [shared, setShared] = useState(item.shared);

    const change = (next: boolean) => {
        setShared(next);
        router.patch(
            ClientSharingController.update.url(item.recordId),
            { shared: next },
            {
                preserveScroll: true,
                onError: () => setShared(!next),
            },
        );
    };

    return (
        <li className="flex items-center justify-between gap-3 py-2.5">
            <label htmlFor={id} className="text-sm font-medium">
                Con {item.trainerName}
            </label>
            <Switch id={id} checked={shared} onCheckedChange={change} />
        </li>
    );
}
