import { Link } from '@inertiajs/react';
import { ChevronDown, Plus } from 'lucide-react';
import { useId, useState } from 'react';
import { Initials, PackageRing } from '@/components/trainer/ui/bits';
import {
    blockTitleClassName,
    brandButtonClassName,
    pressableRowClassName,
} from '@/components/trainer/ui/styles';
import { formatDayRelative, formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { clients, services } from '@/routes/trainer';
import type { TrainerPackage } from '@/types';

/** The tiles shown before "Vedi tutti". */
const PREVIEW = 4;

type PackagesBlockProps = {
    packages: TrainerPackage[];
    /** Phones: tiles in two columns; desktop: rows in the side panel. */
    variant: 'tiles' | 'rows';
};

/**
 * "Pacchetti attivi": the packages bought and not finished, the ones about
 * to end first, with a ring of the sessions left. A tile opens the client's
 * card. "Crea pacchetto" opens "Servizi e prezzi", where packages are made.
 */
export default function PackagesBlock({
    packages,
    variant,
}: PackagesBlockProps) {
    const titleId = useId();
    const listId = useId();
    const [all, setAll] = useState(false);
    const shown = all ? packages : packages.slice(0, PREVIEW);

    return (
        <section aria-labelledby={titleId} className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
                <h2 id={titleId} className={blockTitleClassName}>
                    Pacchetti attivi
                </h2>
                {variant === 'tiles' ? (
                    <Link
                        href={services()}
                        aria-label="Crea pacchetto"
                        title="Crea pacchetto"
                        className={cn(brandButtonClassName, 'size-11 px-0')}
                    >
                        <Plus
                            aria-hidden="true"
                            className="size-5"
                            strokeWidth={2.5}
                        />
                    </Link>
                ) : (
                    <Link
                        href={services()}
                        className={cn(brandButtonClassName, 'h-9 px-3.5')}
                    >
                        <Plus
                            aria-hidden="true"
                            className="size-4"
                            strokeWidth={2.5}
                        />
                        Crea pacchetto
                    </Link>
                )}
            </div>

            {packages.length === 0 ? (
                <p className="rounded-[22px] border border-dashed border-[#3a3a3a] px-4 py-5 text-[15px] text-muted-foreground">
                    Nessun pacchetto in corso
                </p>
            ) : variant === 'tiles' ? (
                <div id={listId} className="grid grid-cols-2 gap-2.5">
                    {shown.map((item, index) => {
                        const hot = index === 0 && item.total - item.done <= 2;

                        return (
                            <Link
                                key={item.id}
                                href={clients.url({
                                    query: {
                                        cliente: item.clientId ?? undefined,
                                    },
                                })}
                                className={cn(
                                    'flex flex-col gap-3.5 rounded-3xl p-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                                    hot
                                        ? 'bg-brand text-[#0a0a0a]'
                                        : 'bg-card text-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]',
                                )}
                            >
                                <span className="flex items-center justify-between">
                                    <Initials
                                        name={item.clientName}
                                        size={36}
                                        className={
                                            hot
                                                ? 'bg-[rgba(10,10,10,0.15)] text-[#0a0a0a]'
                                                : undefined
                                        }
                                    />
                                    <PackageRing
                                        done={item.done}
                                        total={item.total}
                                        size={52}
                                        tone={hot ? 'dark' : 'brand'}
                                    />
                                </span>
                                <span className="flex flex-col gap-0.5">
                                    <span className="truncate text-[17px] font-semibold">
                                        {item.clientName}
                                    </span>
                                    <span
                                        className={cn(
                                            'truncate text-[13px]',
                                            hot
                                                ? 'text-[rgba(10,10,10,0.7)]'
                                                : 'text-muted-foreground',
                                        )}
                                    >
                                        {item.name}
                                    </span>
                                </span>
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <div
                    id={listId}
                    className="flex flex-col gap-0.5 rounded-[22px] bg-card p-1"
                >
                    {shown.map((item) => {
                        const left = item.total - item.done;

                        return (
                            <Link
                                key={item.id}
                                href={clients.url({
                                    query: {
                                        cliente: item.clientId ?? undefined,
                                    },
                                })}
                                className={cn(
                                    'flex items-center gap-3 rounded-2xl px-3 py-2.5',
                                    pressableRowClassName,
                                )}
                            >
                                <PackageRing
                                    done={item.done}
                                    total={item.total}
                                    tone={left <= 1 ? 'light' : 'brand'}
                                />
                                <span className="flex min-w-0 flex-1 flex-col gap-px">
                                    <span className="truncate text-[15px] font-semibold">
                                        {item.clientName}
                                    </span>
                                    <span className="truncate text-[13px] text-muted-foreground">
                                        {item.name} ·{' '}
                                        {left === 1
                                            ? '1 seduta rimasta'
                                            : `${left} sedute rimaste`}
                                    </span>
                                    <span className="truncate text-xs text-muted-foreground">
                                        {item.nextStart
                                            ? `Prossima: ${formatDayRelative(item.nextStart)}, ${formatTime(item.nextStart)}`
                                            : 'Nessuna seduta prenotata'}
                                    </span>
                                </span>
                            </Link>
                        );
                    })}
                </div>
            )}

            {packages.length > PREVIEW && (
                <button
                    type="button"
                    onClick={() => setAll(!all)}
                    aria-expanded={all}
                    aria-controls={listId}
                    className="inline-flex min-h-11 items-center justify-center gap-1.5 self-center text-[15px] font-semibold text-brand outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                    {all ? 'Mostra meno' : `Vedi tutti e ${packages.length}`}
                    <ChevronDown
                        aria-hidden="true"
                        className={cn(
                            'size-4 transition-transform',
                            all && 'rotate-180',
                        )}
                    />
                </button>
            )}
        </section>
    );
}
