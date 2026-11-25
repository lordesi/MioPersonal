import type { PastWeekSummary as Summary } from '@/types';

/**
 * The last 7 days at the top of "Sedute passate" (design "Trainer · Sedute
 * passate · nuovo"): the sessions, the attendance and the hours of work.
 */
export default function PastWeekSummary({ summary }: { summary: Summary }) {
    const attendance =
        summary.sessions > 0
            ? Math.round(
                  ((summary.sessions - summary.missed) / summary.sessions) *
                      100,
              )
            : null;

    const stats = [
        {
            label: 'Sedute in 7 giorni',
            value: String(summary.sessions),
            brand: false,
        },
        {
            label: 'Presenze',
            value: attendance === null ? '–' : `${attendance}%`,
            brand: attendance !== null,
        },
        {
            label: 'Ore di lavoro',
            value: `${String(summary.hours).replace('.', ',')} h`,
            brand: false,
        },
    ];

    return (
        <dl className="flex gap-5">
            {stats.map((stat) => (
                <div key={stat.label} className="flex flex-col gap-1">
                    <dt className="order-2 text-sm text-muted-foreground">
                        {stat.label}
                    </dt>
                    <dd
                        className={
                            stat.brand
                                ? 'order-1 text-[30px] leading-9 font-bold text-brand tabular-nums'
                                : 'order-1 text-[30px] leading-9 font-bold tabular-nums'
                        }
                    >
                        {stat.value}
                    </dd>
                </div>
            ))}
        </dl>
    );
}
