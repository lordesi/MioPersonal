import { Link } from '@inertiajs/react';
import Panel from '@/components/trainer/area/panel';
import PackageProgress from '@/components/trainer/package-progress';
import { Button } from '@/components/ui/button';
import { formatDayTimeRelative } from '@/lib/format';
import type { ClientPackage } from '@/types';

type PackagePanelProps = {
    pack: ClientPackage;
    now: Date;
};

/**
 * "Il tuo pacchetto": the sessions left (not done yet) and the next one
 * booked. Packages don't expire.
 */
export default function PackagePanel({ pack, now }: PackagePanelProps) {
    const left = pack.total - pack.done;
    const toBook = pack.total - pack.booked;

    return (
        <Panel title="Il tuo pacchetto" className="gap-3.5">
            {/* Right under the title, as in the design. */}
            <span className="-mt-3 text-sm text-muted-foreground">
                {pack.name} con{' '}
                <Link href={pack.trainerHref} className="hover:underline">
                    {pack.trainerName}
                </Link>
            </span>
            <span className="flex items-baseline gap-1.5">
                <span className="text-4xl leading-10 font-bold tracking-[-0.03em] tabular-nums">
                    {left}
                </span>
                <span className="text-sm text-muted-foreground">
                    {left === 1 ? 'seduta rimasta' : 'sedute rimaste'} su{' '}
                    {pack.total}
                </span>
            </span>
            <PackageProgress done={pack.done} total={pack.total} />
            <span className="text-[13px] leading-4.5 text-muted-foreground tabular-nums">
                {pack.nextStart
                    ? `${pack.done === 0 ? 'Prima seduta del pacchetto' : 'Prossima seduta del pacchetto'}: ${formatDayTimeRelative(pack.nextStart, now)}`
                    : 'Nessuna seduta prenotata, per ora.'}
            </span>
            {toBook > 0 && (
                <Button
                    asChild
                    variant="outline"
                    className="h-10 self-start rounded-[10px] px-3.5"
                >
                    <Link href={pack.trainerHref}>Prenota la prossima</Link>
                </Button>
            )}
        </Panel>
    );
}
