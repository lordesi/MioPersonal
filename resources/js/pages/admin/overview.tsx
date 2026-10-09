import { Head, Link } from '@inertiajs/react';
import AdminPanel from '@/components/admin/admin-panel';
import { formatDayMonthShort, formatDayMonthTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { bookings, messages, reviews, verification } from '@/routes/admin';
import type { AdminActivity } from '@/types';

type OverviewProps = {
    todo: {
        verificationCount: number;
        oldestWaitDays: number;
        unreadMessages: number;
        privacyRequests: number;
        expiredToday: number;
        flaggedReviews: number;
    };
    stats: {
        users: number;
        usersThisWeek: number;
        activeTrainers: number;
        approvedThisWeek: number;
        bookingsThisWeek: number;
        bookingsLastWeek: number;
        confirmedRate: number;
        expiredRate: number;
        declinedRate: number;
    };
    /** Oldest first, the last one is today. */
    bookingsPerDay: { date: string; count: number }[];
    activity: AdminActivity[];
};

/** (1, 'giorno', 'giorni') → "1 giorno"; (3, …) → "3 giorni" */
function plural(count: number, one: string, many: string): string {
    return `${count} ${count === 1 ? one : many}`;
}

/** 0.91 → "91%" */
function percent(ratio: number): string {
    return `${Math.round(ratio * 100)}%`;
}

export default function Overview({
    todo,
    stats,
    bookingsPerDay,
    activity,
}: OverviewProps) {
    const todoCards = [
        {
            count: todo.verificationCount,
            label: 'Trainer da verificare',
            hint: `Il più vecchio aspetta da ${plural(todo.oldestWaitDays, 'giorno', 'giorni')}`,
            href: verification(),
        },
        {
            count: todo.unreadMessages,
            label: 'Messaggi da leggere',
            hint: `${plural(todo.privacyRequests, 'richiesta', 'richieste')} privacy: rispondere entro 30 giorni`,
            href: messages(),
        },
        {
            count: todo.expiredToday,
            label: 'Prenotazioni decadute oggi',
            hint: 'Trainer che non hanno risposto in 24 h',
            href: bookings(),
        },
        {
            count: todo.flaggedReviews,
            label:
                todo.flaggedReviews === 1
                    ? 'Recensione con avviso'
                    : 'Recensioni con avviso',
            hint: 'Contiene un numero di telefono',
            href: reviews(),
        },
    ];

    const weekChange =
        (stats.bookingsThisWeek - stats.bookingsLastWeek) /
        stats.bookingsLastWeek;

    const statCards = [
        {
            label: 'Iscritti totali',
            value: String(stats.users),
            detail: `+${stats.usersThisWeek} questa settimana`,
        },
        {
            label: 'Trainer attivi',
            value: String(stats.activeTrainers),
            detail: `+${stats.approvedThisWeek} approvati questa settimana`,
        },
        {
            label: 'Prenotazioni (7 giorni)',
            value: String(stats.bookingsThisWeek),
            detail: `${weekChange >= 0 ? '+' : '−'}${percent(Math.abs(weekChange))} rispetto alla settimana prima`,
        },
        {
            label: 'Prenotazioni confermate',
            value: percent(stats.confirmedRate),
            detail: `Decadute: ${percent(stats.expiredRate)}, rifiutate: ${percent(stats.declinedRate)}`,
        },
    ];

    const counts = bookingsPerDay.map((day) => day.count);
    const max = Math.max(...counts, 1);
    const middle = bookingsPerDay[Math.floor(bookingsPerDay.length / 2)];
    const chartLabel = `Prenotazioni al giorno negli ultimi ${counts.length} giorni, da ${Math.min(...counts)} a ${max}, oggi ${counts.at(-1) ?? 0}`;

    return (
        <>
            <Head title="Admin · Panoramica" />

            <section
                aria-label="Da fare"
                className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
            >
                {todoCards.map((card) => (
                    <Link
                        key={card.label}
                        href={card.href}
                        className="flex flex-col items-start gap-1.5 rounded-[14px] border bg-card p-4 hover:border-foreground"
                    >
                        <span className="text-4xl font-bold tracking-tighter tabular-nums">
                            {card.count}
                        </span>
                        <span className="text-[15px] font-semibold">
                            {card.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {card.hint}
                        </span>
                        <span className="mt-1 text-[13px] font-semibold underline">
                            Apri
                        </span>
                    </Link>
                ))}
            </section>

            <section
                aria-label="Numeri"
                className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
            >
                {statCards.map((card) => (
                    <div
                        key={card.label}
                        className="flex flex-col gap-1 rounded-[14px] bg-primary p-4 text-primary-foreground"
                    >
                        <span className="text-[13px] opacity-70">
                            {card.label}
                        </span>
                        <span className="text-[28px] leading-8.5 font-bold tracking-tighter tabular-nums">
                            {card.value}
                        </span>
                        <span className="text-xs tabular-nums opacity-70">
                            {card.detail}
                        </span>
                    </div>
                ))}
            </section>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                <AdminPanel
                    title="Prenotazioni al giorno"
                    aside={`Ultimi ${counts.length} giorni`}
                >
                    <div
                        role="img"
                        aria-label={chartLabel}
                        className="flex h-45 items-end gap-1.5 border-b pt-2"
                    >
                        {bookingsPerDay.map((day, index) => (
                            <span
                                key={day.date}
                                title={`${day.count} prenotazioni`}
                                style={{
                                    height: `${(day.count / max) * 100}%`,
                                }}
                                className={cn(
                                    'flex-1 rounded-t',
                                    index === bookingsPerDay.length - 1
                                        ? 'bg-foreground'
                                        : 'bg-muted-foreground',
                                )}
                            />
                        ))}
                    </div>
                    <div className="flex justify-between text-[11px] text-muted-foreground tabular-nums">
                        <span>
                            {formatDayMonthShort(bookingsPerDay[0].date)}
                        </span>
                        <span>{formatDayMonthShort(middle.date)}</span>
                        <span>Oggi</span>
                    </div>
                </AdminPanel>

                <AdminPanel title="Attività recente">
                    <ActivityList activity={activity} />
                </AdminPanel>
            </div>
        </>
    );
}

function ActivityList({ activity }: { activity: AdminActivity[] }) {
    return (
        <ul className="flex flex-col">
            {activity.map((entry) => (
                <li
                    key={entry.id}
                    className="flex flex-col gap-0.5 border-b py-2.5 text-sm last:border-b-0"
                >
                    <span>
                        <strong className="font-semibold">{entry.who}</strong>{' '}
                        {entry.what}
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                        {formatDayMonthTime(entry.at)}
                    </span>
                </li>
            ))}
        </ul>
    );
}

Overview.layout = { section: 'overview' };
