import { CalendarRange, ChevronDown } from 'lucide-react';
import { Fragment, useId, useState } from 'react';
import { areaSectionTitleClassName } from '@/components/mp/area-bits';
import RangeSheet from '@/components/trainer/home/range-sheet';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDayMonthShort, formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { TrainerDashboardStats, TrainerStatsPeriod } from '@/types';

const PERIODS: { value: TrainerStatsPeriod; label: string; short: string }[] = [
    { value: 'oggi', label: 'Oggi', short: 'Oggi' },
    { value: '7', label: 'Ultimi 7 giorni', short: '7 giorni' },
    { value: '30', label: 'Ultimi 30 giorni', short: '30 giorni' },
    { value: '90', label: 'Ultimi 3 mesi', short: '3 mesi' },
    {
        value: 'intervallo',
        label: 'Intervallo personalizzato',
        short: 'Intervallo',
    },
];

type StatsBlockProps = {
    stats: TrainerDashboardStats;
    today: string;
    /** A new period: `periodo`, and `dal`/`al` for the custom one. */
    onChange: (period: TrainerStatsPeriod, from?: string, to?: string) => void;
};

/** "+12%"; null when there is nothing to compare with. */
function percentChange(value: number, before: number): string | null {
    if (before === 0) {
        return null;
    }

    const change = Math.round(((value - before) / before) * 100);

    return `${change > 0 ? '+' : change < 0 ? '−' : ''}${Math.abs(change)}%`;
}

/** "1,2k €" on the points of the line. */
function shortPrice(cents: number): string {
    const euros = Math.round(cents / 100);

    return euros >= 1000
        ? `${(euros / 1000).toFixed(euros % 1000 === 0 ? 0 : 1).replace('.', ',')}k €`
        : `${euros} €`;
}

/**
 * "Statistiche" (design "Trainer · Oggi · nuovo"): the period, the earnings
 * in big with their line, then the visits to the profile, the sessions, the
 * new clients and the requests confirmed, each with the change on the
 * period just before.
 */
export default function StatsBlock({
    stats,
    today,
    onChange,
}: StatsBlockProps) {
    const titleId = useId();
    // "Intervallo personalizzato": the calendar of "Scegli data", from and to.
    const [choosing, setChoosing] = useState(false);
    const custom = stats.period === 'intervallo';
    const label = custom
        ? `${formatDayMonthShort(stats.from)} – ${formatDayMonthShort(stats.to)}`
        : PERIODS.find((period) => period.value === stats.period)?.short;
    const earningsDelta = percentChange(
        stats.earningsCents,
        stats.earningsBeforeCents,
    );
    const newClientsDelta = stats.newClients - stats.newClientsBefore;

    const metrics = [
        {
            label: 'Visite al profilo',
            value: stats.views.toLocaleString('it-IT'),
            delta: percentChange(stats.views, stats.viewsBefore),
        },
        {
            label: 'Sedute fatte',
            value: stats.sessions.toLocaleString('it-IT'),
            delta: percentChange(stats.sessions, stats.sessionsBefore),
        },
        {
            label: 'Nuovi clienti',
            value: stats.newClients.toLocaleString('it-IT'),
            delta:
                newClientsDelta > 0
                    ? `+${newClientsDelta}`
                    : newClientsDelta < 0
                      ? `−${Math.abs(newClientsDelta)}`
                      : null,
        },
        {
            label: 'Richieste confermate',
            value:
                stats.confirmedRate === null
                    ? '–'
                    : `${Math.round(stats.confirmedRate * 100)}%`,
            delta: null,
        },
    ];

    return (
        <section aria-labelledby={titleId} className="flex flex-col gap-4.5">
            <div className="flex items-center justify-between gap-3">
                <h2 id={titleId} className={areaSectionTitleClassName}>
                    Statistiche
                </h2>
                <DropdownMenu>
                    <DropdownMenuTrigger
                        aria-label={`Periodo: ${label}`}
                        className="inline-flex h-11 items-center gap-2.5 rounded-[14px] bg-card px-3.5 text-[15px] font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        {label}
                        <ChevronDown aria-hidden="true" className="size-4.5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className="w-62 rounded-2xl border-0 bg-[#1c1e21] p-1.5 shadow-[0_24px_60px_rgba(0,0,0,0.6)]"
                    >
                        <DropdownMenuRadioGroup
                            value={stats.period}
                            onValueChange={(value) => {
                                const period = value as TrainerStatsPeriod;

                                // "Intervallo personalizzato" opens the calendar (onSelect below).
                                if (period !== 'intervallo') {
                                    onChange(period);
                                }
                            }}
                        >
                            {PERIODS.map((period) => (
                                <DropdownMenuRadioItem
                                    key={period.value}
                                    value={period.value}
                                    onSelect={() => {
                                        // After the menu has closed: a dialog opened while it closes loses its focus.
                                        if (period.value === 'intervallo') {
                                            window.setTimeout(
                                                () => setChoosing(true),
                                                0,
                                            );
                                        }
                                    }}
                                    className="h-11 rounded-xl text-[15px] font-semibold data-[state=checked]:bg-brand/12 data-[state=checked]:text-brand"
                                >
                                    {period.label}
                                </DropdownMenuRadioItem>
                            ))}
                        </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {custom && (
                <button
                    type="button"
                    onClick={() => setChoosing(true)}
                    className="chip self-start"
                >
                    <CalendarRange aria-hidden="true" className="size-4" />
                    {formatDayMonthShort(stats.from)} –{' '}
                    {formatDayMonthShort(stats.to)}
                    <span className="text-brand">Cambia</span>
                </button>
            )}

            <RangeSheet
                open={choosing}
                onOpenChange={setChoosing}
                today={today}
                from={stats.from}
                to={stats.to}
                onApply={(from, to) => onChange('intervallo', from, to)}
            />

            <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Guadagni</span>
                <b className="text-[44px] leading-none font-bold tracking-[-0.03em] tabular-nums">
                    {formatPrice(stats.earningsCents)}
                </b>
                {earningsDelta && (
                    <span
                        className={cn(
                            'text-sm font-semibold tabular-nums',
                            earningsDelta.startsWith('+')
                                ? 'text-brand'
                                : 'text-muted-foreground',
                        )}
                    >
                        {earningsDelta} rispetto al periodo prima
                    </span>
                )}
            </div>

            {stats.earningsSeries.length > 1 && (
                <EarningsLine series={stats.earningsSeries} />
            )}

            <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                {metrics.map((metric) => (
                    <div key={metric.label} className="flex flex-col gap-0.5">
                        <span className="flex items-baseline gap-2">
                            <b className="text-[26px] leading-8 font-bold tabular-nums">
                                {metric.value}
                            </b>
                            {metric.delta && (
                                <span
                                    className={cn(
                                        'text-[13px] font-semibold tabular-nums',
                                        metric.delta.startsWith('+')
                                            ? 'text-brand'
                                            : 'text-muted-foreground',
                                    )}
                                >
                                    {metric.delta}
                                </span>
                            )}
                        </span>
                        <span className="text-sm text-muted-foreground">
                            {metric.label}
                        </span>
                    </div>
                ))}
            </div>
        </section>
    );
}

/**
 * The line of the earnings (design "Trainer · Oggi · nuovo"): the turquoise
 * line over an area fading to transparent, a dot on each point (the last
 * one bigger and turquoise) with its value above (none at 0 €), and the
 * labels below.
 */
function EarningsLine({
    series,
}: {
    series: TrainerDashboardStats['earningsSeries'];
}) {
    // Only letters and digits: url(#…) of the fill doesn't take React's ":r1:".
    const gradientId = `earn${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
    const max = Math.max(...series.map((point) => point.cents), 1) * 1.15;
    const x = (index: number) => ((index + 0.5) / series.length) * 100;
    const y = (cents: number) => 100 - (cents / max) * 100;
    const points = series.map(
        (point, index) => `${x(index).toFixed(2)} ${y(point.cents).toFixed(2)}`,
    );
    const line = `M${points.join(' L')}`;
    const area = `M${x(0).toFixed(2)} 100 L${points.join(' L')} L${x(series.length - 1).toFixed(2)} 100 Z`;
    const description = series
        .map((point) => `${point.label}: ${formatPrice(point.cents)}`)
        .join(', ');

    return (
        <div
            role="img"
            aria-label={`Andamento dei guadagni. ${description}`}
            className="flex flex-col gap-2.5"
        >
            <div className="relative mt-[18px] h-35">
                <svg
                    aria-hidden="true"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    className="absolute inset-0 size-full overflow-visible"
                >
                    <defs>
                        <linearGradient
                            id={gradientId}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                        >
                            <stop
                                offset="0"
                                stopColor="#42D7D9"
                                stopOpacity="0.22"
                            />
                            <stop
                                offset="1"
                                stopColor="#42D7D9"
                                stopOpacity="0"
                            />
                        </linearGradient>
                    </defs>
                    <path d={area} fill={`url(#${gradientId})`} />
                    <path
                        d={line}
                        fill="none"
                        stroke="#42D7D9"
                        strokeWidth="2.5"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                    />
                </svg>
                {series.map((point, index) => {
                    const last = index === series.length - 1;
                    const position = {
                        left: `${x(index)}%`,
                        top: `${y(point.cents)}%`,
                    };

                    return (
                        <Fragment key={index}>
                            <span
                                aria-hidden="true"
                                className={cn(
                                    'absolute rounded-full',
                                    last
                                        ? '-mt-1.5 -ml-1.5 size-3 bg-[#42D7D9] shadow-[0_0_0_2px_rgba(66,215,217,0.25)]'
                                        : '-mt-1 -ml-1 size-2 bg-black shadow-[0_0_0_2px_#42D7D9]',
                                )}
                                style={position}
                            />
                            {/* No "0 €" over the days without earnings. */}
                            {series.length <= 7 && point.cents > 0 && (
                                <span
                                    aria-hidden="true"
                                    className={cn(
                                        'absolute -translate-x-1/2 -translate-y-[150%] text-xs font-bold whitespace-nowrap tabular-nums',
                                        last
                                            ? 'text-[#42D7D9]'
                                            : 'text-muted-foreground',
                                    )}
                                    style={position}
                                >
                                    {shortPrice(point.cents)}
                                </span>
                            )}
                        </Fragment>
                    );
                })}
            </div>
            <div aria-hidden="true" className="flex">
                {series.map((point, index) => (
                    <span
                        key={index}
                        className="flex-1 text-center text-xs text-muted-foreground"
                    >
                        {point.label}
                    </span>
                ))}
            </div>
        </div>
    );
}
