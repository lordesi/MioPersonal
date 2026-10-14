import { Head, Link } from '@inertiajs/react';
import { bookings, reviews, verification } from '@/routes/admin';

type OverviewProps = {
    todo: {
        verificationCount: number;
        oldestWaitDays: number;
        expiredToday: number;
        /** Profiles and reviews reported by users (reporting system: to do). */
        reportedCount: number;
    };
    stats: {
        users: number;
        usersThisWeek: number;
        /** Trainers who used the web app in the last 24 hours. */
        activeTrainers: number;
        bookingsThisWeek: number;
        bookingsLastWeek: number;
        confirmedRate: number;
        expiredRate: number;
        declinedRate: number;
    };
};

/** (1, 'giorno', 'giorni') → "1 giorno"; (3, …) → "3 giorni" */
function plural(count: number, one: string, many: string): string {
    return `${count} ${count === 1 ? one : many}`;
}

/** 0.91 → "91%" */
function percent(ratio: number): string {
    return `${Math.round(ratio * 100)}%`;
}

export default function Overview({ todo, stats }: OverviewProps) {
    const todoCards = [
        {
            count: todo.verificationCount,
            label: 'Trainer da verificare',
            hint: `Il più vecchio aspetta da ${plural(todo.oldestWaitDays, 'giorno', 'giorni')}`,
            href: verification(),
        },
        {
            count: todo.expiredToday,
            label: 'Prenotazioni decadute oggi',
            hint: 'Trainer che non hanno risposto in 24 h',
            href: bookings(),
        },
        {
            count: todo.reportedCount,
            label: 'Profili e recensioni segnalate',
            hint: 'Segnalati dagli utenti',
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
            detail: 'Entrati nelle ultime 24 ore',
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

    return (
        <>
            <Head title="Admin · Panoramica" />

            <section
                aria-label="Da fare"
                className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
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
        </>
    );
}

Overview.layout = { section: 'overview' };
