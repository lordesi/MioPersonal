import { Link } from '@inertiajs/react';
import UserAvatar from '@/components/shared/user-avatar';
import Panel from '@/components/trainer/area/panel';
import PackageProgress from '@/components/trainer/package-progress';
import { romeParts } from '@/lib/calendar';
import { formatDayLong, formatTime } from '@/lib/format';
import { clients } from '@/routes/trainer';
import type { TrainerPackage } from '@/types';

/** "Pacchetti attivi" of "Panoramica": the sessions done of each package. */
export default function ActivePackages({
    packages,
}: {
    packages: TrainerPackage[];
}) {
    return (
        // flex-1: it fills the column down to the bottom of Agenda.
        <Panel title="Pacchetti attivi" className="flex-1 gap-3.5">
            {packages.length === 0 ? (
                <span className="text-sm text-muted-foreground">
                    Nessun pacchetto attivo. Quando un cliente compra un
                    pacchetto lo trovi qui, con le sedute svolte.
                </span>
            ) : (
                <ul className="flex flex-col gap-5">
                    {packages.map((pack) => (
                        <li key={pack.id} className="flex flex-col gap-2.5">
                            <div className="flex items-center gap-3">
                                <UserAvatar
                                    name={pack.clientName}
                                    size="md"
                                    className="[&_[data-slot=avatar-fallback]]:bg-secondary"
                                />
                                <span className="flex min-w-0 flex-1 flex-col">
                                    <span className="text-[15px] leading-5.5 font-semibold">
                                        {pack.clientId === null ? (
                                            pack.clientName
                                        ) : (
                                            <Link
                                                href={clients({
                                                    query: {
                                                        cliente: pack.clientId,
                                                    },
                                                })}
                                                className="hover:underline"
                                            >
                                                {pack.clientName}
                                            </Link>
                                        )}
                                    </span>
                                    <span className="text-[13px] leading-4.5 text-muted-foreground">
                                        {pack.name}
                                    </span>
                                </span>
                                <span className="text-sm font-bold tabular-nums">
                                    {pack.done}/{pack.total}
                                </span>
                            </div>
                            <PackageProgress
                                done={pack.done}
                                total={pack.total}
                            />
                            {pack.nextStart !== null && (
                                <span className="text-[13px] leading-4.5 text-muted-foreground tabular-nums">
                                    {nextLabel(pack.nextStart, pack.done)}
                                </span>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </Panel>
    );
}

/** "Prima seduta del pacchetto: lunedì 19 ottobre, ore 14:00" */
function nextLabel(nextStart: string, done: number): string {
    const day = formatDayLong(romeParts(nextStart).date).toLowerCase();
    const label = done === 0 ? 'Prima seduta del pacchetto' : 'Prossima seduta';

    return `${label}: ${day}, ore ${formatTime(nextStart)}`;
}
