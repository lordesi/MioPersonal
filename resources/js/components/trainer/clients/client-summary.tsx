import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { TrainerClient } from '@/types';

type Mark = { id: number; day: string; state: 'done' | 'missed' | 'planned' };

const monthFormatter = new Intl.DateTimeFormat('it-IT', {
    month: 'long',
    timeZone: 'Europe/Rome',
});
const dayFormatter = new Intl.DateTimeFormat('it-IT', {
    day: 'numeric',
    timeZone: 'Europe/Rome',
});
const keyFormatter = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    timeZone: 'Europe/Rome',
});

/** The months shown in "Presenze": the current one and the one before. */
const MONTHS = 2;

/**
 * The top of the card of a client (design "Trainer · Scheda cliente · V5"):
 * the sessions done, the attendance and what they spent; then "Presenze",
 * the days of the last two months, done, missed or planned.
 */
export default function ClientSummary({ client }: { client: TrainerClient }) {
    const over = client.done + client.missed;
    const attendance = over > 0 ? Math.round((client.done / over) * 100) : null;

    const marks: (Mark & { month: string; label: string })[] = [
        ...client.past.map((session) => ({
            id: session.id,
            day: session.start,
            state: session.noShow ? ('missed' as const) : ('done' as const),
        })),
        ...client.upcoming.map((session) => ({
            id: session.id,
            day: session.start,
            state: 'planned' as const,
        })),
    ]
        .map((mark) => ({
            ...mark,
            month: keyFormatter.format(new Date(mark.day)),
            label: dayFormatter.format(new Date(mark.day)),
        }))
        .sort((a, b) => a.day.localeCompare(b.day));

    const now = new Date();
    const keys = Array.from({ length: MONTHS }, (_, back) =>
        keyFormatter.format(
            new Date(now.getFullYear(), now.getMonth() - back, 15),
        ),
    );
    const months = keys
        .map((key) => {
            const items = marks.filter((mark) => mark.month === key);
            const counted = items.filter((mark) => mark.state !== 'planned');

            return {
                key,
                name: items[0]
                    ? monthFormatter.format(new Date(items[0].day))
                    : null,
                items,
                done: counted.filter((mark) => mark.state === 'done').length,
                counted: counted.length,
            };
        })
        .filter((month) => month.items.length > 0);
    const missedRecently = months.reduce(
        (sum, month) => sum + month.counted - month.done,
        0,
    );

    const stats = [
        { label: 'Sedute fatte', value: String(client.done), brand: false },
        {
            label: 'Presenze',
            value: attendance === null ? '–' : `${attendance}%`,
            brand: attendance !== null,
        },
        {
            label: 'Spesi con te',
            value: formatPrice(client.paidCents),
            brand: false,
        },
    ];

    return (
        <div className="flex flex-col gap-6">
            <dl className="grid grid-cols-3 gap-3">
                {stats.map((stat) => (
                    <div key={stat.label} className="flex flex-col gap-0.5">
                        <dt className="order-2 text-[13px] text-muted-foreground">
                            {stat.label}
                        </dt>
                        <dd
                            className={cn(
                                'order-1 text-[26px] leading-8 font-bold tracking-[-0.02em] tabular-nums md:text-[30px] md:leading-9',
                                stat.brand && 'text-brand',
                            )}
                        >
                            {stat.value}
                        </dd>
                    </div>
                ))}
            </dl>

            {months.length > 0 && (
                <section
                    aria-labelledby={`presenze-${client.recordId}`}
                    className="flex flex-col gap-4"
                >
                    <div className="flex items-baseline justify-between gap-3">
                        <h3
                            id={`presenze-${client.recordId}`}
                            className="text-xl font-bold"
                        >
                            Presenze
                        </h3>
                        <span className="text-[13px] text-muted-foreground">
                            {missedRecently === 0
                                ? 'Nessuna saltata'
                                : missedRecently === 1
                                  ? '1 saltata in 2 mesi'
                                  : `${missedRecently} saltate in 2 mesi`}
                        </span>
                    </div>
                    {months.map((month) => (
                        <div key={month.key} className="flex flex-col gap-2.5">
                            <div className="flex items-baseline justify-between">
                                <b className="text-base font-semibold first-letter:uppercase">
                                    {month.name}
                                </b>
                                {month.counted > 0 && (
                                    <span className="text-sm font-semibold text-muted-foreground tabular-nums">
                                        {month.done} di {month.counted}
                                    </span>
                                )}
                            </div>
                            <ul className="flex flex-wrap gap-2">
                                {month.items.map((mark) => (
                                    <li
                                        key={`${mark.state}-${mark.id}`}
                                        aria-label={`${mark.label} ${month.name}, ${
                                            mark.state === 'done'
                                                ? 'fatta'
                                                : mark.state === 'missed'
                                                  ? 'saltata'
                                                  : 'in programma'
                                        }`}
                                        className={cn(
                                            'flex size-10 items-center justify-center rounded-xl text-[15px] font-bold tabular-nums',
                                            mark.state === 'done' &&
                                                'bg-brand text-black',
                                            mark.state === 'missed' &&
                                                'bg-[#1c1e21] text-muted-foreground',
                                            mark.state === 'planned' &&
                                                'text-[#b9a6ff] shadow-[inset_0_0_0_1.5px_#b9a6ff]',
                                        )}
                                    >
                                        {mark.label}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                    <div
                        aria-hidden="true"
                        className="flex flex-wrap gap-4 text-[13px] text-muted-foreground"
                    >
                        <span className="flex items-center gap-1.5">
                            <span className="size-3 rounded bg-brand" />
                            Fatta
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="size-3 rounded bg-[#1c1e21]" />
                            Saltata
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="size-3 rounded shadow-[inset_0_0_0_1.5px_#b9a6ff]" />
                            In programma
                        </span>
                    </div>
                </section>
            )}
        </div>
    );
}
