import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * The charts of "Admin · Statistiche": one series each, in the ink of the
 * text (the site is black and white), with the value on hover and the
 * numbers in a table under each chart ("Vedi i dati").
 */

const LOCALE = 'it-IT';

export function formatNumber(value: number): string {
    return new Intl.NumberFormat(LOCALE).format(value);
}

export function formatPercent(rate: number | null): string {
    return rate === null
        ? '—'
        : new Intl.NumberFormat(LOCALE, {
              style: 'percent',
              maximumFractionDigits: 1,
          }).format(rate);
}

/** "2026-11" → "nov 26". */
export function formatMonth(month: string, long = false): string {
    const [year, number] = month.split('-').map(Number);

    return new Intl.DateTimeFormat(LOCALE, {
        month: long ? 'long' : 'short',
        year: long ? 'numeric' : '2-digit',
        timeZone: 'UTC',
    }).format(new Date(Date.UTC(year, number - 1, 1)));
}

/** "2026-11-06" → "6 nov". */
export function formatDay(day: string): string {
    const [year, month, date] = day.split('-').map(Number);

    return new Intl.DateTimeFormat(LOCALE, {
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC',
    }).format(new Date(Date.UTC(year, month - 1, date)));
}

export type Point = { label: string; value: number };

/**
 * "+12% rispetto ai 30 giorni prima": in words and with an arrow, never by
 * color alone. Nothing when there is nothing to compare with.
 */
export function Delta({
    value,
    previous,
}: {
    value: number;
    previous: number | null;
}) {
    if (previous === null || (previous === 0 && value === 0)) {
        return (
            <span className="text-xs text-muted-foreground">
                Nessun confronto
            </span>
        );
    }

    if (previous === 0) {
        return (
            <span className="text-xs text-muted-foreground">
                ▲ nuovo rispetto a 0
            </span>
        );
    }

    const change = (value - previous) / previous;
    const arrow = change > 0 ? '▲' : change < 0 ? '▼' : '=';

    return (
        <span className="text-xs text-muted-foreground tabular-nums">
            {arrow} {change > 0 && '+'}
            {formatPercent(change)} vs 30 giorni prima
        </span>
    );
}

/** A big number with its label and the comparison. */
export function KpiTile({
    label,
    value,
    detail,
}: {
    label: string;
    value: string;
    detail?: ReactNode;
}) {
    return (
        <div className="flex flex-col gap-1 rounded-[14px] border bg-card p-4">
            <span className="text-[13px] text-muted-foreground">{label}</span>
            <span className="text-[28px] leading-8.5 font-bold tracking-tighter tabular-nums">
                {value}
            </span>
            {detail}
        </div>
    );
}

/** The numbers of a chart, folded under it. */
function DataTable({
    points,
    unit,
    format,
}: {
    points: Point[];
    unit: string;
    format: (value: number) => string;
}) {
    return (
        <details className="text-sm">
            <summary className="cursor-pointer text-[13px] text-muted-foreground hover:text-foreground">
                Vedi i dati
            </summary>
            <div className="mt-2 max-h-64 overflow-auto rounded-lg border">
                <table className="w-full text-left text-[13px] tabular-nums">
                    <thead className="sticky top-0 bg-secondary">
                        <tr>
                            <th className="px-3 py-1.5 font-medium">Periodo</th>
                            <th className="px-3 py-1.5 text-right font-medium">
                                {unit}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {points.map((point) => (
                            <tr key={point.label} className="border-t">
                                <td className="px-3 py-1.5">{point.label}</td>
                                <td className="px-3 py-1.5 text-right">
                                    {format(point.value)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </details>
    );
}

const HEIGHT = 160;
const WIDTH = 600;

/**
 * A line over time with a light area under it; hovering (or focusing) a
 * point shows its value. The scale starts at 0.
 */
export function LineChart({
    points,
    unit,
    format = formatNumber,
}: {
    points: Point[];
    unit: string;
    format?: (value: number) => string;
}) {
    const [active, setActive] = useState<number | null>(null);
    const max = Math.max(1, ...points.map((point) => point.value));
    const step = points.length > 1 ? WIDTH / (points.length - 1) : WIDTH;
    const x = (index: number) => index * step;
    const y = (value: number) => HEIGHT - (value / max) * (HEIGHT - 8);
    const line = points
        .map(
            (point, index) =>
                `${index === 0 ? 'M' : 'L'}${x(index)},${y(point.value)}`,
        )
        .join(' ');
    const shown = active === null ? null : points[active];

    return (
        <div className="flex flex-col gap-2">
            <div className="relative">
                <svg
                    viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                    preserveAspectRatio="none"
                    className="h-40 w-full overflow-visible"
                    role="img"
                    aria-label={`${unit}: da ${format(points[0]?.value ?? 0)} a ${format(points.at(-1)?.value ?? 0)}, massimo ${format(max)}`}
                    onMouseLeave={() => setActive(null)}
                >
                    {/* Recessive grid: the top and the baseline. */}
                    <line
                        x1={0}
                        x2={WIDTH}
                        y1={HEIGHT}
                        y2={HEIGHT}
                        className="stroke-border"
                        vectorEffect="non-scaling-stroke"
                    />
                    <line
                        x1={0}
                        x2={WIDTH}
                        y1={8}
                        y2={8}
                        className="stroke-border"
                        strokeDasharray="3 4"
                        vectorEffect="non-scaling-stroke"
                    />
                    <path
                        d={`${line} L${x(points.length - 1)},${HEIGHT} L0,${HEIGHT} Z`}
                        className="fill-foreground/6"
                    />
                    <path
                        d={line}
                        className="fill-none stroke-foreground"
                        strokeWidth={2}
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                    />
                    {active !== null && (
                        <line
                            x1={x(active)}
                            x2={x(active)}
                            y1={0}
                            y2={HEIGHT}
                            className="stroke-foreground/40"
                            vectorEffect="non-scaling-stroke"
                        />
                    )}
                    {/* Hit areas wider than the line. */}
                    {points.map((point, index) => (
                        <rect
                            key={point.label}
                            x={x(index) - step / 2}
                            y={0}
                            width={step}
                            height={HEIGHT}
                            className="fill-transparent"
                            onMouseEnter={() => setActive(index)}
                        />
                    ))}
                </svg>
                <span className="pointer-events-none absolute top-0 left-0 -translate-y-1/2 text-[11px] text-muted-foreground tabular-nums">
                    {format(max)}
                </span>
                {shown && active !== null && (
                    <div
                        role="status"
                        className="pointer-events-none absolute top-2 z-10 -translate-x-1/2 rounded-lg bg-foreground px-2.5 py-1.5 text-xs whitespace-nowrap text-background shadow-sm"
                        style={{
                            left: `${Math.min(92, Math.max(8, (active / Math.max(1, points.length - 1)) * 100))}%`,
                        }}
                    >
                        <span className="opacity-70">{shown.label}</span>{' '}
                        <span className="font-semibold tabular-nums">
                            {format(shown.value)}
                        </span>
                    </div>
                )}
            </div>
            <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>{points[0]?.label}</span>
                <span>{points.at(-1)?.label}</span>
            </div>
            <DataTable points={points} unit={unit} format={format} />
        </div>
    );
}

/** Vertical bars, one per period; hovering or focusing a bar shows its value. */
export function BarChart({
    points,
    unit,
    format = formatNumber,
}: {
    points: Point[];
    unit: string;
    format?: (value: number) => string;
}) {
    const [active, setActive] = useState<number | null>(null);
    const max = Math.max(1, ...points.map((point) => point.value));
    const last = points.at(-1);

    return (
        <div className="flex flex-col gap-2">
            <div
                className="relative flex h-40 items-end gap-[2px] border-b"
                onMouseLeave={() => setActive(null)}
            >
                <span className="pointer-events-none absolute top-0 left-0 -translate-y-1/2 text-[11px] text-muted-foreground tabular-nums">
                    {format(max)}
                </span>
                {points.map((point, index) => (
                    <button
                        key={point.label}
                        type="button"
                        aria-label={`${point.label}: ${format(point.value)}`}
                        onMouseEnter={() => setActive(index)}
                        onFocus={() => setActive(index)}
                        onBlur={() => setActive(null)}
                        className="group relative flex h-full flex-1 items-end focus-visible:outline-none"
                    >
                        <span
                            className={cn(
                                'w-full rounded-t-[4px] bg-foreground/80 group-hover:bg-foreground group-focus-visible:bg-foreground',
                                point.value === 0 && 'bg-transparent',
                            )}
                            style={{
                                height: `${point.value === 0 ? 0 : Math.max(2, (point.value / max) * 100)}%`,
                            }}
                        />
                        {active === index && (
                            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 rounded-lg bg-foreground px-2.5 py-1.5 text-xs whitespace-nowrap text-background shadow-sm">
                                <span className="opacity-70">
                                    {point.label}
                                </span>{' '}
                                <span className="font-semibold tabular-nums">
                                    {format(point.value)}
                                </span>
                            </span>
                        )}
                    </button>
                ))}
            </div>
            <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>{points[0]?.label}</span>
                {last && (
                    <span>
                        {last.label}:{' '}
                        <span className="font-semibold text-foreground tabular-nums">
                            {format(last.value)}
                        </span>
                    </span>
                )}
            </div>
            <DataTable points={points} unit={unit} format={format} />
        </div>
    );
}

/** Horizontal bars with the label and the number: channels, cities, searches. */
export function BarList({
    rows,
    empty = 'Ancora nessun dato.',
}: {
    rows: { source: string; count: number }[];
    empty?: string;
}) {
    const max = Math.max(1, ...rows.map((row) => row.count));
    const total = rows.reduce((sum, row) => sum + row.count, 0);

    if (rows.length === 0) {
        return <p className="text-sm text-muted-foreground">{empty}</p>;
    }

    return (
        <ul className="flex flex-col gap-1.5">
            {rows.map((row) => (
                <li
                    key={row.source}
                    className="relative flex items-center justify-between gap-3 overflow-hidden rounded-lg px-2.5 py-1.5 text-sm"
                >
                    <span
                        aria-hidden="true"
                        className="absolute inset-y-0 left-0 rounded-lg bg-foreground/8"
                        style={{ width: `${(row.count / max) * 100}%` }}
                    />
                    <span className="relative min-w-0 truncate">
                        {row.source}
                    </span>
                    <span className="relative flex-none tabular-nums">
                        <span className="font-semibold">
                            {formatNumber(row.count)}
                        </span>{' '}
                        <span className="text-muted-foreground">
                            {formatPercent(row.count / Math.max(1, total))}
                        </span>
                    </span>
                </li>
            ))}
        </ul>
    );
}

/** The steps from the visitors to the bookings, with the share kept from the step before. */
export function Funnel({
    steps,
    rates = true,
}: {
    steps: { label: string; count: number }[];
    /** Off for states that are not steps one after the other. */
    rates?: boolean;
}) {
    const max = Math.max(
        1,
        steps[0]?.count ?? 0,
        ...steps.map((step) => step.count),
    );

    return (
        <ol className="flex flex-col gap-2">
            {steps.map((step, index) => {
                const before = index > 0 ? steps[index - 1].count : null;

                return (
                    <li key={step.label} className="flex flex-col gap-1">
                        <div className="flex items-baseline justify-between gap-3 text-sm">
                            <span>{step.label}</span>
                            <span className="tabular-nums">
                                <span className="font-semibold">
                                    {formatNumber(step.count)}
                                </span>
                                {rates && before !== null && (
                                    <span className="text-muted-foreground">
                                        {' '}
                                        ·{' '}
                                        {before === 0
                                            ? '—'
                                            : formatPercent(
                                                  step.count / before,
                                              )}{' '}
                                        del passo prima
                                    </span>
                                )}
                            </span>
                        </div>
                        <span className="h-2.5 overflow-hidden rounded-full bg-secondary">
                            <span
                                className="block h-full rounded-full bg-foreground"
                                style={{
                                    width: `${(step.count / max) * 100}%`,
                                }}
                            />
                        </span>
                    </li>
                );
            })}
        </ol>
    );
}

/**
 * Retention by month of sign-up: one hue, darker = more clients still
 * active; the percentage is always written in the cell.
 */
export function CohortTable({
    cohorts,
}: {
    cohorts: { month: string; size: number; retention: (number | null)[] }[];
}) {
    const captionId = useId();
    const columns = cohorts[0]?.retention.length ?? 0;

    return (
        <div className="overflow-x-auto">
            <table
                aria-describedby={captionId}
                className="w-full min-w-[560px] border-separate border-spacing-[2px] text-[13px] tabular-nums"
            >
                <thead>
                    <tr className="text-muted-foreground">
                        <th className="px-2 py-1 text-left font-medium">
                            Iscritti a
                        </th>
                        <th className="px-2 py-1 text-right font-medium">
                            Clienti
                        </th>
                        {Array.from({ length: columns }, (_, offset) => (
                            <th key={offset} className="px-2 py-1 font-medium">
                                {offset === 0
                                    ? 'Stesso mese'
                                    : `+${offset} mesi`}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {cohorts.map((cohort) => (
                        <tr key={cohort.month}>
                            <th className="px-2 py-1.5 text-left font-medium capitalize">
                                {formatMonth(cohort.month, true)}
                            </th>
                            <td className="px-2 py-1.5 text-right">
                                {formatNumber(cohort.size)}
                            </td>
                            {cohort.retention.map((rate, offset) => (
                                <td
                                    key={offset}
                                    className={cn(
                                        'rounded-md px-2 py-1.5 text-center',
                                        rate === null
                                            ? 'text-muted-foreground'
                                            : rate >= 0.5
                                              ? 'text-background'
                                              : 'text-foreground',
                                    )}
                                    style={
                                        rate === null
                                            ? undefined
                                            : {
                                                  backgroundColor: `color-mix(in oklab, var(--foreground) ${Math.round(8 + rate * 80)}%, transparent)`,
                                              }
                                    }
                                >
                                    {rate === null ? '' : formatPercent(rate)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            <p id={captionId} className="mt-2 text-xs text-muted-foreground">
                Quota dei clienti iscritti in quel mese che hanno usato
                MioPersonal nel mese indicato.
            </p>
        </div>
    );
}
