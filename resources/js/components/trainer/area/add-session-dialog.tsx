import { Link } from '@inertiajs/react';
import SessionPopover from '@/components/trainer/session/session-popover';
import type { PopoverAnchor } from '@/components/trainer/session/session-popover';
import SessionSheet from '@/components/trainer/session/session-sheet';
import { useSessionForm } from '@/components/trainer/session/use-session-form';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { services as servicesPage } from '@/routes/trainer';
import type { SessionOptions } from '@/types';

export type { PopoverAnchor };

type AddSessionDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    options: SessionOptions;
    /** "YYYY-MM-DD": the day chosen in the calendar. */
    date: string;
    /** "YYYY-MM-DD", Rome. */
    today: string;
    /** "Prenota" from a client's card: the client chosen at first. */
    clientId?: number;
    /** "HH:MM": the hour clicked in the grid. */
    time?: string;
    /** Desktop: the button or the hour the popover opens from (centered without). */
    anchor?: PopoverAnchor | null;
    /** Opened from an hour of the grid: the day and the time under the title. */
    fromSlot?: boolean;
};

/**
 * "Nuova seduta" (TrainerManualSessionController): with someone of the
 * list or someone new, at any time. A sheet on phones, a popover on
 * desktop. Without an account the session is confirmed at once; with an
 * account the client gets a notification to accept it.
 */
export default function AddSessionDialog({
    open,
    onOpenChange,
    options,
    date,
    today,
    clientId,
    time,
    anchor = null,
    fromSlot = false,
}: AddSessionDialogProps) {
    return open ? (
        <SessionForm
            // A fresh form each time it opens on another day or hour.
            key={`${date} ${time ?? ''} ${clientId ?? ''}`}
            options={options}
            date={date}
            time={time}
            today={today}
            clientId={clientId}
            anchor={anchor}
            fromSlot={fromSlot}
            onClose={() => onOpenChange(false)}
        />
    ) : null;
}

function SessionForm({
    options,
    date,
    time,
    today,
    clientId,
    anchor,
    fromSlot,
    onClose,
}: {
    options: SessionOptions;
    date: string;
    time?: string;
    today: string;
    clientId?: number;
    anchor: PopoverAnchor | null;
    fromSlot: boolean;
    onClose: () => void;
}) {
    const isMobile = useIsMobile();
    const form = useSessionForm(options, {
        date,
        time,
        today,
        clientId,
    });
    const onOpenChange = (next: boolean) => !next && onClose();

    if (options.services.length === 0) {
        return (
            <Dialog open onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Aggiungi seduta</DialogTitle>
                        <DialogDescription>
                            Per mettere una seduta in calendario serve almeno un
                            servizio: il prezzo e la durata partono da lì.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            asChild
                            className="h-11 rounded-xl font-semibold"
                        >
                            <Link href={servicesPage()}>
                                Vai a Servizi e prezzi
                            </Link>
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    const save = () => form.save(onClose);

    return isMobile ? (
        <SessionSheet
            open
            onOpenChange={onOpenChange}
            form={form}
            today={today}
            onSave={save}
        />
    ) : (
        <SessionPopover
            open
            onOpenChange={onOpenChange}
            form={form}
            today={today}
            anchor={anchor}
            fromSlot={fromSlot}
            onSave={save}
        />
    );
}
