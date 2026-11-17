import { Link } from '@inertiajs/react';
import { Mail, ShieldCheck } from 'lucide-react';
import { IconBadge, darkCardClassName } from '@/components/mp/page-bits';
import { cn } from '@/lib/utils';
import { privacy } from '@/routes/legal';

/** Side boxes of the Contatti page: direct email, personal data. */
export default function ContactAside({
    email,
    className,
}: {
    email: string;
    className?: string;
}) {
    return (
        <aside
            aria-label="Altri modi per contattarci"
            className={cn('flex flex-col gap-2 md:gap-4', className)}
        >
            <section
                aria-label="Contatti diretti"
                className={cn(
                    darkCardClassName,
                    'flex items-center gap-3 px-4 py-3.5 md:gap-4 md:p-6',
                )}
            >
                <IconBadge icon={Mail} />
                <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-[13px] leading-4.5 text-muted-foreground">
                        Preferisci l’email?
                    </span>
                    <a
                        href={`mailto:${email}`}
                        className="text-[17px] leading-5.5 font-semibold break-all text-brand outline-none hover:text-[#7fe6e7] focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                        {email}
                    </a>
                </span>
            </section>

            <section
                aria-label="Privacy"
                className={cn(
                    darkCardClassName,
                    'flex items-start gap-3 px-4 py-3.5 md:gap-4 md:p-6',
                )}
            >
                <IconBadge icon={ShieldCheck} />
                <span className="flex flex-col gap-1">
                    <span className="text-[17px] leading-5.5 font-semibold">
                        I tuoi dati
                    </span>
                    <span className="text-[13px] leading-4.5 text-muted-foreground md:text-[15px] md:leading-5.25">
                        Per accedere, correggere o cancellare i tuoi dati scegli
                        l’argomento «Privacy e dati». Trovi tutto nella{' '}
                        <Link href={privacy()} className="text-brand underline">
                            privacy policy
                        </Link>
                        .
                    </span>
                </span>
            </section>
        </aside>
    );
}
