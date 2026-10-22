import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { availability } from '@/routes/trainer';

type HandledSummaryProps = {
    total: number;
    confirmed: number;
    expired: number;
    declined: number;
    /** Already on: no need to suggest it. */
    autoConfirm: boolean;
};

/**
 * The dark box on top of "Gestite": how many requests were handled and how.
 * With requests expired without an answer, it suggests confirming automatically.
 */
export default function HandledSummary({
    total,
    confirmed,
    expired,
    declined,
    autoConfirm,
}: HandledSummaryProps) {
    const stats = [
        { value: confirmed, label: 'Confermate' },
        { value: expired, label: 'Annullate' },
        { value: declined, label: 'Rifiutate' },
    ];

    return (
        <section
            aria-label="Riepilogo delle richieste gestite"
            className="flex flex-col gap-4 rounded-3xl bg-sidebar px-5.5 py-5 text-sidebar-foreground"
        >
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                <span className="mr-auto text-[26px] leading-8 font-bold tracking-[-0.03em] tabular-nums">
                    {total === 1
                        ? '1 richiesta gestita'
                        : `${total} richieste gestite`}
                </span>
                {stats.map((stat) => (
                    <span
                        key={stat.label}
                        className="flex min-w-29.5 items-center gap-2.5 rounded-[14px] bg-sidebar-accent px-3.5 py-2.5"
                    >
                        <span className="text-[22px] leading-7 font-bold tabular-nums">
                            {stat.value}
                        </span>
                        <span className="text-[13px] leading-4.5 text-sidebar-foreground/70">
                            {stat.label}
                        </span>
                    </span>
                ))}
            </div>

            {expired > 0 && !autoConfirm && (
                <div className="flex justify-end pt-3.5">
                    <Link
                        href={availability()}
                        className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-sidebar-foreground px-3 text-[13px] leading-4.5 font-semibold text-sidebar"
                    >
                        Attiva la conferma automatica
                        <ArrowRight
                            aria-hidden="true"
                            className="size-3.5"
                            strokeWidth={2.5}
                        />
                    </Link>
                </div>
            )}
        </section>
    );
}
