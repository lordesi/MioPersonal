import { Link } from '@inertiajs/react';
import ProgressBar from '@/components/shared/progress-bar';
import { Button } from '@/components/ui/button';
import { formatUntilDay } from '@/lib/format';
import type { ClientPackage } from '@/types';

type PackageCardProps = {
    pack: ClientPackage;
};

/** A package of sessions: how many are used and until when it is valid. */
export default function PackageCard({ pack }: PackageCardProps) {
    return (
        <article className="flex flex-col gap-3 rounded-xl border bg-card p-3.5 md:p-5">
            <span className="flex flex-col">
                <span className="text-base font-semibold">
                    {pack.name} · {pack.trainerName}
                </span>
                <span className="text-[13px] text-muted-foreground tabular-nums">
                    {pack.used} usate · {pack.total - pack.used} rimaste ·
                    valido fino {formatUntilDay(pack.validUntil)}
                </span>
            </span>
            <ProgressBar
                value={pack.used}
                max={pack.total}
                label="Sedute usate del pacchetto"
                className="h-2"
            />
            <div className="flex gap-2">
                <Button asChild className="h-10 px-3.5">
                    <Link href={pack.trainerHref}>Prenota la prossima</Link>
                </Button>
            </div>
        </article>
    );
}
