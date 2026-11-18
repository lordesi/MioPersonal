import { Check, ChevronDown } from 'lucide-react';
import { useId, useState } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { blockTitleClassName } from '@/components/trainer/ui/styles';
import { formatDayMonthShort } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { TrainerDashboardStats, TrainerStatsPeriod } from '@/types';

const PERIODS: { value: TrainerStatsPeriod; label: string }[] = [
    { value: 'oggi', label: 'Oggi' },
    { value: '7', label: 'Ultimi 7 giorni' },
    { value: '30', label: 'Ultimi 30 giorni' },
    { value: 'intervallo', label: 'Intervallo personalizzato' },
];

const COMPARED: Record<TrainerStatsPeriod, string> = {
    oggi: 'rispetto a ieri',
    '7': 'rispetto ai 7 giorni prima',
    '30': 'rispetto ai 30 giorni prima',
    intervallo: 'rispetto al periodo prima',
};

type StatsBlockProps = {
    stats: TrainerDashboardStats;
    today: string;
    /** A new period: `periodo`, and `dal`/`al` for the custom one. */
    onChange: (period: TrainerStatsPeriod, from?: string, to?: string) => void;
    /** Desktop: bigger numbers in the panel. */
    size?: 'sm' | 'lg';
};

/**
 * "Statistiche": the visits to the public profile and the sessions of a
 * period (today, 7 or 30 days, or two dates), each with the change on the
 * period just before.
 */
export default function StatsBlock({
    stats,
    today,
    onChange,
    size = 'sm',
}: StatsBlockProps) {
    const titleId = useId();
    const [from, setFrom] = useState(stats.from);
    const [to, setTo] = useState(stats.to);
    const custom = stats.period === 'intervallo';
    const label = custom
        ? `${formatDayMonthShort(stats.from)} – ${formatDayMonthShort(stats.to)}`
        : PERIODS.find((period) => period.value === stats.period)?.label;

    const tiles = [
        {
            label: 'Visite al profilo',
            value: stats.views,
            before: stats.viewsBefore,
            hint: null,
        },
        {
            label: 'Sedute prenotate',
            value: stats.sessions,
            before: stats.sessionsBefore,
            hint:
                stats.hours > 0
                    ? `${String(stats.hours).replace('.', ',')} h di allenamento`
                    : null,
        },
    ];

    return (
        <section aria-labelledby={titleId} className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
                <h2 id={titleId} className={blockTitleClassName}>
                    Statistiche
                </h2>
                <DropdownMenu>
                    <DropdownMenuTrigger
                        className={cn(
                            'inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[15px] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                            size === 'lg'
                                ? 'bg-card text-foreground'
                                : 'text-muted-foreground',
                        )}
                    >
                        {label}
                        <ChevronDown aria-hidden="true" className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className="w-60 rounded-[18px] p-1.5"
                    >
                        <DropdownMenuRadioGroup
                            value={stats.period}
                            onValueChange={(value) => {
                                const period = value as TrainerStatsPeriod;

                                if (period === 'intervallo') {
                                    onChange(period, from, to);
                                } else {
                                    onChange(period);
                                }
                            }}
                        >
                            {PERIODS.map((period) => (
                                <DropdownMenuRadioItem
                                    key={period.value}
                                    value={period.value}
                                    className="h-10 rounded-xl text-[15px]"
                                >
                                    {period.label}
                                </DropdownMenuRadioItem>
                            ))}
                        </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {custom && (
                <form
                    className="grid grid-cols-[1fr_1fr_auto] items-end gap-2"
                    onSubmit={(event) => {
                        event.preventDefault();
                        onChange('intervallo', from, to);
                    }}
                >
                    <DateField
                        label="Dal"
                        value={from}
                        max={to}
                        onChange={setFrom}
                    />
                    <DateField
                        label="Al"
                        value={to}
                        max={today}
                        onChange={setTo}
                    />
                    <button
                        type="submit"
                        aria-label="Applica l’intervallo"
                        title="Applica"
                        className="flex size-12 items-center justify-center rounded-2xl bg-brand text-[#0a0a0a] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                        <Check aria-hidden="true" className="size-5" />
                    </button>
                </form>
            )}

            <div className="grid grid-cols-2 gap-2.5">
                {tiles.map((tile) => (
                    <div
                        key={tile.label}
                        className="flex flex-col gap-2 rounded-[22px] bg-card px-4 pt-4.5 pb-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]"
                    >
                        <span className="text-[13px] text-muted-foreground">
                            {tile.label}
                        </span>
                        <span
                            className={cn(
                                'font-bold tracking-[-0.5px] tabular-nums',
                                size === 'lg'
                                    ? 'text-[34px] leading-10'
                                    : 'text-[28px] leading-8',
                            )}
                        >
                            {tile.value.toLocaleString('it-IT')}
                        </span>
                        {tile.hint && (
                            <span className="text-[13px] text-[#d4d4d4]">
                                {tile.hint}
                            </span>
                        )}
                        <Delta
                            value={tile.value}
                            before={tile.before}
                            compared={COMPARED[stats.period]}
                        />
                    </div>
                ))}
            </div>
        </section>
    );
}

/** "+18% rispetto ai 7 giorni prima": turquoise when it grows. */
function Delta({
    value,
    before,
    compared,
}: {
    value: number;
    before: number;
    compared: string;
}) {
    if (before === 0) {
        return (
            <span className="text-xs text-muted-foreground">
                {value === 0 ? 'Nessun dato ancora' : `Nessun dato ${compared}`}
            </span>
        );
    }

    const change = Math.round(((value - before) / before) * 100);
    const sign = change > 0 ? '+' : change < 0 ? '−' : '';

    return (
        <span
            className={cn(
                'text-xs tabular-nums',
                change > 0 ? 'text-brand' : 'text-muted-foreground',
            )}
        >
            {sign}
            {Math.abs(change)}% {compared}
        </span>
    );
}

function DateField({
    label,
    value,
    max,
    onChange,
}: {
    label: string;
    value: string;
    max: string;
    onChange: (value: string) => void;
}) {
    const id = useId();

    return (
        <span className="flex flex-col gap-1 rounded-2xl bg-card px-3.5 py-1.5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
            <label htmlFor={id} className="text-[11px] text-muted-foreground">
                {label}
            </label>
            <input
                id={id}
                type="date"
                value={value}
                max={max}
                required
                onChange={(event) => onChange(event.target.value)}
                className="w-full bg-transparent text-[15px] font-semibold [color-scheme:dark] outline-none"
            />
        </span>
    );
}
