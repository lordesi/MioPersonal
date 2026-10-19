import { Link } from '@inertiajs/react';
import UserAvatar from '@/components/shared/user-avatar';
import Panel from '@/components/trainer/area/panel';
import PackageProgress from '@/components/trainer/package-progress';
import { romeParts } from '@/lib/calendar';
import { formatDayLong, formatTime } from '@/lib/format';
import { show as showClient } from '@/routes/trainer/clients';
import type { TrainerPackage } from '@/types';

/** "Pacchetti attivi" of "Panoramica": the sessions done of each package. */
export default function ActivePackages({
    packages,
}: {
    packages: TrainerPackage[];
}) {
    return (
        <Panel title="Pacchetti attivi" className="gap-3.5">
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
                                                href={showClient(pack.clientId)}
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
                            <span className="text-[13px] leading-4.5 text-muted-foreground tabular-nums">
                                {nextLabel(pack)}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </Panel>
    );
}

/** "Prima seduta del pacchetto: lunedì 19 ottobre, ore 14:00" */
function nextLabel(pack: TrainerPackage): string {
    if (pack.nextStart === null) {
        const left = pack.total - pack.booked;

        // The ones not done were marked "Saltata": none left to book.
        if (left <= 0) {
            return 'Tutte le sedute sono già state prenotate.';
        }

        return left === 1
            ? 'Nessuna seduta prenotata: ne resta 1 da prenotare.'
            : `Nessuna seduta prenotata: ne restano ${left} da prenotare.`;
    }

    const day = formatDayLong(romeParts(pack.nextStart).date).toLowerCase();
    const label =
        pack.done === 0 ? 'Prima seduta del pacchetto' : 'Prossima seduta';

    return `${label}: ${day}, ore ${formatTime(pack.nextStart)}`;
}
