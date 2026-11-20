import { Head, Link, router } from '@inertiajs/react';
import { CalendarDays } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import DayItemCard from '@/components/client/home/day-item-card';
import SuggestionCard from '@/components/client/home/suggestion-card';
import NotificationBell from '@/components/layout/notification-bell';
import WeekStrip from '@/components/trainer/home/week-strip';
import {
    blockTitleClassName,
    pageTitleClassName,
} from '@/components/trainer/ui/styles';
import { formatDayLong } from '@/lib/format';
import { gymSearchUrl } from '@/lib/gym';
import { searchUrl } from '@/lib/search';
import { cn } from '@/lib/utils';
import { home } from '@/routes/client';
import type {
    ClientDayItem,
    GymSummary,
    TrainerSummary,
    TrainerWeekDay,
} from '@/types';

type HomeProps = {
    firstName: string;
    /** Rome dates "YYYY-MM-DD". */
    today: string;
    day: string;
    minDate: string;
    maxDate: string;
    week: TrainerWeekDay[];
    dayBookings: ClientDayItem[];
    trainers: TrainerSummary[];
    gyms: GymSummary[];
};

/** The props a change of day reloads. */
const DAY_PROPS = ['day', 'week', 'dayBookings'];

/** The card open at first: the first one not over yet, else the first. */
function firstOpen(items: ClientDayItem[], now: Date): string | null {
    return (
        items.find((item) => new Date(item.end) > now)?.key ??
        items[0]?.key ??
        null
    );
}

/**
 * "Home" of the client: the week with a dot on the days with sessions, the
 * sessions and events of the chosen day, then trainers and gyms to try.
 * Phones: one column. Desktop: the week and the day side by side, the
 * suggestions in a grid under them.
 */
export default function Home({
    firstName,
    today,
    day,
    minDate,
    maxDate,
    week,
    dayBookings,
    trainers,
    gyms,
}: HomeProps) {
    const [now] = useState(() => new Date());
    const [openKey, setOpenKey] = useState<string | null>(() =>
        firstOpen(dayBookings, now),
    );

    const pickDay = (date: string) => {
        router.get(
            home.url({
                query: date === today ? {} : { giorno: date },
            }),
            {},
            {
                only: DAY_PROPS,
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onSuccess: (page) => {
                    const items = (page.props as unknown as HomeProps)
                        .dayBookings;
                    setOpenKey(firstOpen(items, now));
                },
            },
        );
    };

    const isToday = day === today;
    const title = isToday
        ? 'Prenotazioni di oggi'
        : `Prenotazioni di ${formatDayLong(day).split(' ')[0].toLowerCase()}`;

    return (
        <>
            <Head title="Home" />

            <header className="flex min-h-13 items-center justify-between gap-4">
                <h1
                    className={cn(
                        pageTitleClassName,
                        'md:text-[34px] md:leading-10.25',
                    )}
                >
                    Ciao, {firstName}
                </h1>
                <NotificationBell
                    tone="dark"
                    className="size-13 rounded-full border border-[#707070]"
                />
            </header>

            <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:items-start lg:gap-8">
                <section
                    aria-label="Settimana"
                    className="lg:sticky lg:top-4 lg:rounded-[30px] lg:border lg:border-border lg:bg-[#141414] lg:p-5"
                >
                    <WeekStrip
                        week={week}
                        day={day}
                        today={today}
                        minDate={minDate}
                        maxDate={maxDate}
                        onPick={pickDay}
                    />
                </section>

                <section
                    aria-labelledby="day-title"
                    className="flex flex-col gap-4"
                >
                    <div className="flex items-center gap-3">
                        <h2 id="day-title" className={blockTitleClassName}>
                            {title}
                        </h2>
                        {dayBookings.length > 0 && (
                            <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-secondary px-2 text-[15px] font-semibold tabular-nums">
                                {dayBookings.length}
                            </span>
                        )}
                    </div>

                    {dayBookings.length > 0 ? (
                        <div className="flex flex-col gap-3">
                            {dayBookings.map((item) => (
                                <DayItemCard
                                    key={item.key}
                                    item={item}
                                    now={now}
                                    open={openKey === item.key}
                                    onToggle={() =>
                                        setOpenKey(
                                            openKey === item.key
                                                ? null
                                                : item.key,
                                        )
                                    }
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3 rounded-[26px] bg-card p-6 text-center">
                            <span className="flex size-13 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                                <CalendarDays
                                    aria-hidden="true"
                                    className="size-6"
                                />
                            </span>
                            <p className="text-[17px] leading-5.5 font-semibold">
                                Nessuna prenotazione
                            </p>
                            <p className="max-w-80 text-[15px] leading-5 text-muted-foreground">
                                {isToday ? 'Oggi è' : 'Questo giorno è'} libero.
                                Trova un trainer o un corso vicino a te.
                            </p>
                            <Link
                                href={searchUrl()}
                                className="mt-1 inline-flex h-11 items-center rounded-full bg-secondary px-5 text-[15px] font-semibold outline-none hover:bg-[#333] focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            >
                                Cerca un trainer
                            </Link>
                        </div>
                    )}
                </section>
            </div>

            {trainers.length > 0 && (
                <Suggestions title="Trainer consigliati" moreHref={searchUrl()}>
                    {trainers.map((trainer) => (
                        <SuggestionCard
                            key={trainer.slug}
                            kind="trainer"
                            trainer={trainer}
                            className={railItemClassName}
                        />
                    ))}
                </Suggestions>
            )}

            {gyms.length > 0 && (
                <Suggestions
                    title="Palestre consigliate"
                    moreHref={gymSearchUrl()}
                >
                    {gyms.map((gym) => (
                        <SuggestionCard
                            key={gym.slug}
                            kind="gym"
                            gym={gym}
                            className={railItemClassName}
                        />
                    ))}
                </Suggestions>
            )}
        </>
    );
}

/** Phones: a card of 200 px in a rail that snaps; from md up a grid. */
const railItemClassName = 'w-50 shrink-0 snap-start md:w-auto';

function Suggestions({
    title,
    moreHref,
    children,
}: {
    title: string;
    moreHref: string;
    children: ReactNode;
}) {
    return (
        <section className="mt-4 flex flex-col gap-2 md:gap-4">
            <div className="flex items-center justify-between gap-3">
                <h2 className={blockTitleClassName}>{title}</h2>
                <Link
                    href={moreHref}
                    className="py-3 text-[15px] font-semibold text-brand outline-none hover:text-[#7fe6e7] focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                    Vedi tutti
                </Link>
            </div>
            <div className="-mx-4 flex snap-x snap-mandatory scroll-px-4 [scrollbar-width:none] gap-3 overflow-x-auto px-4 pt-2 pb-3 md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0 md:pt-0 xl:grid-cols-6 [&::-webkit-scrollbar]:hidden">
                {children}
            </div>
        </section>
    );
}

Home.layout = { section: 'home' };
