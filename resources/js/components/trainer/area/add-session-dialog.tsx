import { Link, router } from '@inertiajs/react';
import { Check, Copy, Mail, MessageCircle } from 'lucide-react';
import { useId, useState } from 'react';
import { toast } from 'sonner';
import SessionPopover from '@/components/trainer/session/session-popover';
import type { PopoverAnchor } from '@/components/trainer/session/session-popover';
import SessionSheet from '@/components/trainer/session/session-sheet';
import { useSessionForm } from '@/components/trainer/session/use-session-form';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useClipboard } from '@/hooks/use-clipboard';
import { useIsMobile } from '@/hooks/use-mobile';
import { whatsAppUrl } from '@/lib/whatsapp';
import { services as servicesPage } from '@/routes/trainer';
import { dismiss } from '@/routes/trainer/clients/invite-prompt';
import type { InvitePrompt, SessionOptions } from '@/types';

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
};

/**
 * "Aggiungi seduta" (TrainerManualSessionController): with someone of the
 * list or someone new, at any time. A glass sheet on phones, a popover on
 * desktop. Without an account the session is confirmed at once and the
 * next step suggests inviting them; with an account the client gets a
 * notification to accept it.
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
}: AddSessionDialogProps) {
    const [invite, setInvite] = useState<InvitePrompt | null>(null);

    return (
        <>
            {open && (
                <SessionForm
                    // A fresh form each time it opens on another day or hour.
                    key={`${date} ${time ?? ''} ${clientId ?? ''}`}
                    options={options}
                    date={date}
                    time={time}
                    today={today}
                    clientId={clientId}
                    anchor={anchor}
                    onClose={() => onOpenChange(false)}
                    onSaved={(prompt) => {
                        onOpenChange(false);
                        setInvite(prompt);
                    }}
                />
            )}

            <Dialog
                open={invite !== null}
                onOpenChange={(next) => !next && setInvite(null)}
            >
                <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
                    {invite && (
                        <InviteStep
                            invite={invite}
                            onDone={() => setInvite(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

function SessionForm({
    options,
    date,
    time,
    today,
    clientId,
    anchor,
    onClose,
    onSaved,
}: {
    options: SessionOptions;
    date: string;
    time?: string;
    today: string;
    clientId?: number;
    anchor: PopoverAnchor | null;
    onClose: () => void;
    onSaved: (invite: InvitePrompt | null) => void;
}) {
    const isMobile = useIsMobile();
    const form = useSessionForm(options, {
        date,
        time,
        today,
        clientId,
        layout: isMobile ? 'sheet' : 'popover',
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

    const save = () => form.save(onSaved);

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
            onSave={save}
        />
    );
}

/**
 * "Invita Marco su Miopersonal": after a session with someone without an
 * account. "Non chiedermelo più" stops it for this person.
 */
function InviteStep({
    invite,
    onDone,
}: {
    invite: InvitePrompt;
    onDone: () => void;
}) {
    const [copied, copy] = useClipboard();
    const [dontAsk, setDontAsk] = useState(false);
    const checkboxId = useId();
    const firstName = invite.name.split(' ')[0];
    const message = `Ciao ${firstName}! Ho messo in calendario le nostre sedute su Miopersonal: iscriviti da qui per vederle, ricevere i promemoria e prenotare da solo/a. ${invite.link}`;

    const done = () => {
        if (dontAsk) {
            router.post(
                dismiss.url(invite.recordId),
                {},
                { preserveScroll: true },
            );
        }

        onDone();
    };

    return (
        <>
            <DialogHeader>
                <span
                    aria-hidden="true"
                    className="mb-1 flex size-10 items-center justify-center rounded-full bg-foreground text-background"
                >
                    <Check className="size-5" strokeWidth={3} />
                </span>
                <DialogTitle>Seduta aggiunta</DialogTitle>
                <DialogDescription>
                    Invita {firstName} su Miopersonal: vedrà le sedute in
                    calendario, riceverà i promemoria e potrà prenotare da solo.
                    Quando si iscrive con il suo link, le sedute diventano sue.
                </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-2">
                <Button asChild className="h-11 rounded-xl font-semibold">
                    <a
                        href={whatsAppUrl(invite.phone ?? '', message)}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <MessageCircle />
                        Invia su WhatsApp
                    </a>
                </Button>
                {invite.email && (
                    <Button
                        asChild
                        variant="outline"
                        className="h-11 rounded-xl"
                    >
                        <a
                            href={`mailto:${invite.email}?subject=${encodeURIComponent('Le nostre sedute su Miopersonal')}&body=${encodeURIComponent(message)}`}
                        >
                            <Mail />
                            Invia per email
                        </a>
                    </Button>
                )}
                <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-xl"
                    onClick={async () => {
                        if (await copy(invite.link)) {
                            toast.success('Link copiato');
                        }
                    }}
                >
                    {copied === invite.link ? <Check /> : <Copy />}
                    {copied === invite.link ? 'Copiato' : 'Copia link'}
                </Button>
            </div>

            <div className="flex items-center gap-2.5">
                <Checkbox
                    id={checkboxId}
                    checked={dontAsk}
                    onCheckedChange={(value) => setDontAsk(value === true)}
                />
                <label htmlFor={checkboxId} className="text-sm">
                    Non chiedermelo più per {firstName}
                </label>
            </div>

            <DialogFooter>
                <Button
                    type="button"
                    variant="ghost"
                    className="h-11 rounded-xl"
                    onClick={done}
                >
                    {dontAsk ? 'Chiudi' : 'Più tardi'}
                </Button>
            </DialogFooter>
        </>
    );
}
