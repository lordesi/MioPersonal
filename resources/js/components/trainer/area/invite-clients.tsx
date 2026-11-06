import { Check, Copy, MessageCircle, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useClipboard } from '@/hooks/use-clipboard';

export type ClientInvite = {
    /** The profile with "?invito=1" and the utm_* of the invite. */
    link: string;
    /** Sign-ups that came from this link. */
    signups: number;
};

/**
 * "Invita i tuoi clienti": the clients the trainer already has book on
 * MioPersonal too, with a link (TrainerClientsController::invite).
 */
export default function InviteClients({
    invite,
    firstName,
}: {
    invite: ClientInvite;
    firstName: string;
}) {
    const [copied, copy] = useClipboard();
    const message = `Ciao! Da ora puoi prenotare le nostre sedute qui, vedi subito gli orari liberi: ${invite.link}`;

    return (
        <section
            aria-labelledby="invite-clients-title"
            className="flex flex-wrap items-center gap-4 rounded-[20px] border bg-card p-5"
        >
            <span className="flex size-11 flex-none items-center justify-center rounded-full bg-foreground text-background">
                <UserPlus aria-hidden="true" className="size-5" />
            </span>
            <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-0.5">
                <h2
                    id="invite-clients-title"
                    className="text-[15px] leading-5.5 font-semibold"
                >
                    Invita i tuoi clienti
                </h2>
                <p className="text-sm text-muted-foreground">
                    Manda il link ai clienti che hai già: prenotano da soli, tu
                    trovi tutto in calendario. Vedono «{firstName} ti ha
                    invitato».
                    {invite.signups > 0 &&
                        ` Iscritti dal tuo invito: ${invite.signups}.`}
                </p>
            </div>
            <div className="flex flex-wrap gap-2">
                <Button asChild className="h-11 px-4 font-semibold">
                    <a
                        href={`https://wa.me/?text=${encodeURIComponent(message)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <MessageCircle />
                        Invia su WhatsApp
                    </a>
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    className="h-11 px-4"
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
        </section>
    );
}
