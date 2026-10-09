import { Link } from '@inertiajs/react';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { privacy } from '@/routes/legal';
import { register as trainerRegister } from '@/routes/trainer';

/** Side boxes of the Contatti page: direct email, trainers, personal data. */
export default function ContactAside({
    email,
    className,
}: {
    email: string;
    className?: string;
}) {
    return (
        <aside className={cn('flex flex-col gap-4', className)}>
            <section
                aria-label="Contatti diretti"
                className="flex flex-col gap-3 rounded-[18px] bg-primary p-5 text-primary-foreground"
            >
                <span className="flex items-center gap-2.5 font-semibold">
                    <Mail aria-hidden="true" className="size-5" />
                    Preferisci l’email?
                </span>
                <a
                    href={`mailto:${email}`}
                    className="text-lg font-bold break-all underline"
                >
                    {email}
                </a>
                <span className="text-[13px] leading-4.75 opacity-75">
                    Siamo un piccolo team a Milano: leggiamo tutto noi e
                    rispondiamo in pochi giorni lavorativi.
                </span>
            </section>

            <section
                aria-label="Per i trainer"
                className="flex flex-col gap-2 rounded-[14px] border bg-card p-4.5"
            >
                <span className="font-semibold">Sei un personal trainer?</span>
                <span className="text-sm text-muted-foreground">
                    Puoi creare il tuo profilo in circa 10 minuti, senza costi
                    durante la beta.
                </span>
                <Button asChild variant="outline" className="h-10 self-start">
                    <Link href={trainerRegister()}>Crea il tuo profilo</Link>
                </Button>
            </section>

            <section
                aria-label="Privacy"
                className="flex flex-col gap-1.5 rounded-[14px] border bg-card p-4.5"
            >
                <span className="font-semibold">I tuoi dati</span>
                <span className="text-sm text-muted-foreground">
                    Per accedere, correggere o cancellare i tuoi dati scegli
                    l’argomento «Privacy e dati». Trovi tutto nella{' '}
                    <Link
                        href={privacy()}
                        className="text-foreground underline"
                    >
                        privacy policy
                    </Link>
                    .
                </span>
            </section>
        </aside>
    );
}
