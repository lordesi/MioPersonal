import { Link, usePage } from '@inertiajs/react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { today } from '@/routes/trainer';
import { show } from '@/routes/trainers';

// TODO: link to the new trainer's own profile preview once profiles are stored.
const PREVIEW_HREF = show('giulia-rossi');

/** Shown after sending the registration: the profile waits for approval. */
export default function Submitted() {
    // A client who became a trainer already verified the email: no new link.
    const emailVerified = !!usePage().props.auth?.user?.email_verified_at;

    return (
        <div className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-xl border bg-card p-6 text-center md:p-10">
            <span className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check aria-hidden="true" className="size-7" />
            </span>
            <h1 className="text-[26px] leading-8 font-semibold tracking-tight md:text-3xl">
                Profilo inviato
            </h1>
            <p className="text-muted-foreground">
                Lo controlliamo prima di pubblicarlo e ti scriviamo appena è
                online.
                {!emailVerified &&
                    ' Intanto conferma la tua email: ti abbiamo mandato un link.'}
            </p>
            <div className="flex w-full flex-wrap justify-center gap-2 pt-2">
                <Button asChild className="h-11 flex-[1_1_180px]">
                    <Link href={today()}>Vai alla tua area</Link>
                </Button>
                <Button
                    asChild
                    variant="outline"
                    className="h-11 flex-[1_1_180px]"
                >
                    <Link href={PREVIEW_HREF}>
                        Vedi l'anteprima del profilo
                    </Link>
                </Button>
            </div>
        </div>
    );
}
