import { useId } from 'react';
import ProgressBar from '@/components/shared/progress-bar';
import ResponsiveText from '@/components/shared/responsive-text';
import UserAvatar from '@/components/shared/user-avatar';
import {
    nextSessionLabel,
    packageLabel,
} from '@/components/trainer/area/client-list';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { TrainerClient } from '@/types';

/** Packages with this many sessions left (or fewer) suggest a renewal. */
const LOW_PACKAGE = 3;

type ClientCardProps = {
    client: TrainerClient;
    note: string;
    onNoteChange: (note: string) => void;
};

/** Details of the selected client: package, practical notes, actions. */
export default function ClientCard({
    client,
    note,
    onNoteChange,
}: ClientCardProps) {
    const noteId = useId();
    const hintId = useId();
    const lowPackage =
        client.package !== null && client.package.left <= LOW_PACKAGE;

    return (
        <aside
            aria-label="Scheda cliente"
            className="flex flex-[1_1_300px] flex-col gap-3.5 rounded-xl border bg-card p-4 md:p-5"
        >
            <div className="flex items-center gap-3">
                <UserAvatar name={client.name} size="lg" />
                <div className="flex flex-col">
                    <span className="text-lg font-bold">{client.name}</span>
                    <span className="text-[13px] leading-4.5 text-muted-foreground tabular-nums">
                        {client.sessions} sedute · prossima{' '}
                        {nextSessionLabel(client)}
                    </span>
                </div>
            </div>

            {client.package && (
                <div className="flex flex-col gap-1.5 rounded-lg bg-muted p-3">
                    <span className="text-sm font-semibold tabular-nums">
                        {client.package.name} · {packageLabel(client)}
                    </span>
                    <ProgressBar
                        value={client.package.total - client.package.left}
                        max={client.package.total}
                        label={`Sedute usate del pacchetto di ${client.name}`}
                        className="bg-background"
                    />
                    {lowPackage && (
                        // TODO: send the client a renewal proposal.
                        <Button
                            type="button"
                            size="sm"
                            className="mt-1 self-start text-[13px]"
                        >
                            <ResponsiveText
                                mobile="Proponi il rinnovo del pacchetto"
                                desktop="Proponi il rinnovo"
                            />
                        </Button>
                    )}
                </div>
            )}

            {/* TODO: save the note on the server. */}
            <div className="flex flex-col gap-1.5">
                <Label htmlFor={noteId}>Note pratiche</Label>
                <Textarea
                    id={noteId}
                    rows={3}
                    value={note}
                    aria-describedby={hintId}
                    onChange={(event) => onNoteChange(event.target.value)}
                />
                <span id={hintId} className="text-xs text-muted-foreground">
                    <ResponsiveText
                        mobile="Niente dati sulla salute."
                        desktop="Solo informazioni pratiche: non inserire dati sulla salute."
                    />
                </span>
            </div>

            <div className="flex flex-wrap gap-2">
                {/* TODO: open the booking flow on behalf of the client. */}
                <Button type="button">Prenota per questo cliente</Button>
                <Button asChild variant="outline">
                    <a href={`mailto:${client.email}`}>Email</a>
                </Button>
            </div>
        </aside>
    );
}
